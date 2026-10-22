import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getMemberSession } from "@/lib/member-auth/session"

export async function GET() {
  const session = await getMemberSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const gymLinks = await prisma.memberGymLink.findMany({
    where: { accountId: session.sub },
    select: { memberId: true, tenant: { select: { name: true, kuickpayInstitutionId: true } } },
  })
  if (gymLinks.length === 0) return NextResponse.json({ invoices: [] })

  const memberIds = gymLinks.map((l) => l.memberId)
  const tenantByMemberId = new Map(gymLinks.map((l) => [l.memberId, l.tenant]))

  const invoices = await prisma.invoice.findMany({
    where: { memberId: { in: memberIds } },
    include: { member: { select: { id: true, consumerNumber: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({
    invoices: invoices.map((inv) => ({
      id: inv.id,
      type: inv.type,
      description: inv.description,
      total: inv.total,
      paidAmount: inv.paidAmount,
      paymentStatus: inv.paymentStatus,
      dueDate: inv.dueDate,
      createdAt: inv.createdAt,
      consumerNumber: inv.member?.consumerNumber ?? null,
      gymName: tenantByMemberId.get(inv.memberId!)?.name ?? null,
      kuickpayInstitutionId: tenantByMemberId.get(inv.memberId!)?.kuickpayInstitutionId ?? null,
    })),
  })
}
