import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

type Params = { params: { id: string } }

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: params.id } })
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 })

  const body = await request.json()
  const { platformPlanId, subscriptionStatus, subscriptionStart, nextBillingDate, subscriptionNotes } = body

  const updated = await prisma.tenant.update({
    where: { id: params.id },
    data: {
      platformPlanId: platformPlanId !== undefined ? (platformPlanId || null) : tenant.platformPlanId,
      subscriptionStatus: subscriptionStatus ?? tenant.subscriptionStatus,
      subscriptionStart: subscriptionStart ? new Date(subscriptionStart) : tenant.subscriptionStart,
      nextBillingDate: nextBillingDate ? new Date(nextBillingDate) : (nextBillingDate === null ? null : tenant.nextBillingDate),
      subscriptionNotes: subscriptionNotes !== undefined ? subscriptionNotes : tenant.subscriptionNotes,
    },
    include: { platformPlan: true },
  })

  return NextResponse.json(updated)
}
