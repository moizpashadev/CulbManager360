import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { buildKuickpayConsumerNo } from "@/lib/kuickpay-no"

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, props: Params) {
  const params = await props.params
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [member, tenant] = await Promise.all([
    prisma.member.findFirst({ where: { id: params.id, tenantId: session.tenantId } }),
    prisma.tenant.findUnique({ where: { id: session.tenantId }, select: { kuickpayInstitutionId: true } }),
  ])
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })

  const body = await request.json()
  const { guestName, fee } = body

  if (!guestName || typeof guestName !== "string" || !guestName.trim()) {
    return NextResponse.json({ error: "guestName is required" }, { status: 400 })
  }
  const feeAmount = Number(fee)
  if (!fee || isNaN(feeAmount) || feeAmount <= 0) {
    return NextResponse.json({ error: "A valid fee is required" }, { status: 400 })
  }

  const invoice = await prisma.invoice.create({
    data: {
      tenantId: session.tenantId,
      memberId: member.id,
      type: "GUEST_FEE",
      description: `Guest: ${guestName.trim()}`,
      subtotal: feeAmount,
      discount: 0,
      total: feeAmount,
      paidAmount: 0,
      paymentStatus: "PENDING",
      dueDate: new Date(),
      kuickpayConsumerNo: buildKuickpayConsumerNo(tenant?.kuickpayInstitutionId, member.consumerNumber),
    },
  })

  return NextResponse.json(invoice, { status: 201 })
}
