import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { buildKuickpayConsumerNo } from "@/lib/kuickpay-no"

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { memberId, type, description, subtotal, discount = 0, dueDate, notes, membershipId } = body

  if (!memberId || !type || subtotal == null) {
    return NextResponse.json({ error: "memberId, type, and subtotal are required" }, { status: 400 })
  }

  const [member, tenant] = await Promise.all([
    prisma.member.findFirst({ where: { id: memberId, tenantId: session.tenantId } }),
    prisma.tenant.findUnique({ where: { id: session.tenantId }, select: { kuickpayInstitutionId: true } }),
  ])
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })

  const sub = Number(subtotal)
  const disc = Number(discount)
  const total = Math.max(0, sub - disc)

  const invoice = await prisma.invoice.create({
    data: {
      tenantId: session.tenantId,
      memberId,
      membershipId: membershipId ?? null,
      type,
      description: description ?? null,
      subtotal: sub,
      discount: disc,
      total,
      paymentStatus: "PENDING",
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes ?? null,
      kuickpayConsumerNo: buildKuickpayConsumerNo(tenant?.kuickpayInstitutionId, member.consumerNumber),
    },
  })

  return NextResponse.json(invoice, { status: 201 })
}
