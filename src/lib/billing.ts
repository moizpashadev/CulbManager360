import { prisma } from "@/lib/db/prisma"

const DUE_GRACE_DAYS = 7

function addMonths(d: Date, n: number) {
  const r = new Date(d)
  r.setMonth(r.getMonth() + n)
  return r
}

export async function runBillingCycle() {
  const now = new Date()
  let invoicesCreated = 0
  let tenantsSuspended = 0

  // 1. Generate invoices for tenants whose billing period has arrived
  const dueTenants = await prisma.tenant.findMany({
    where: {
      subscriptionStatus: { in: ["TRIAL", "ACTIVE", "PAST_DUE"] },
      platformPlanId: { not: null },
      OR: [{ nextBillingDate: null }, { nextBillingDate: { lte: now } }],
    },
    include: { platformPlan: true },
  })

  for (const tenant of dueTenants) {
    const plan = tenant.platformPlan
    if (!plan?.monthlyPrice) continue // one-time/offline plans don't get recurring invoices

    const periodStart = tenant.nextBillingDate ?? now
    const periodEnd = addMonths(periodStart, 1)

    await prisma.$transaction([
      prisma.platformInvoice.create({
        data: {
          tenantId: tenant.id,
          platformPlanId: plan.id,
          amount: plan.monthlyPrice,
          periodStart,
          periodEnd,
          dueDate: periodStart,
          status: "PENDING",
        },
      }),
      prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          nextBillingDate: periodEnd,
          subscriptionStart: tenant.subscriptionStart ?? periodStart,
        },
      }),
    ])
    invoicesCreated++
  }

  // 2. Suspend tenants with invoices unpaid past the grace period
  const graceCutoff = new Date(now.getTime() - DUE_GRACE_DAYS * 24 * 60 * 60 * 1000)
  const overdueInvoices = await prisma.platformInvoice.findMany({
    where: { status: "PENDING", dueDate: { lt: graceCutoff } },
    select: { id: true, tenantId: true },
  })

  const tenantIdsToSuspend = Array.from(new Set(overdueInvoices.map((i) => i.tenantId)))

  if (overdueInvoices.length > 0) {
    await prisma.platformInvoice.updateMany({
      where: { id: { in: overdueInvoices.map((i) => i.id) } },
      data: { status: "OVERDUE" },
    })
  }

  for (const tenantId of tenantIdsToSuspend) {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive: false, subscriptionStatus: "SUSPENDED" },
    })
    tenantsSuspended++
  }

  return { invoicesCreated, tenantsSuspended }
}
