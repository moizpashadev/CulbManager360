import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

type Params = { params: { id: string } }

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
  })
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })

  const body = await request.json()
  const { paymentMethod, amount } = body
  if (!paymentMethod) return NextResponse.json({ error: "paymentMethod is required" }, { status: 400 })

  const total = Number(invoice.total)
  const previouslyPaid = Number(invoice.paidAmount)
  const payNow = amount != null ? Number(amount) : total - previouslyPaid
  const newPaidAmount = previouslyPaid + payNow

  if (payNow <= 0) {
    return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
  }

  const isPaid = newPaidAmount >= total
  const updated = await prisma.invoice.update({
    where: { id: params.id },
    data: {
      paymentStatus: isPaid ? "PAID" : "PARTIAL",
      paymentMethod,
      paidAmount: newPaidAmount,
      paidAt: isPaid ? new Date() : invoice.paidAt,
    },
  })

  return NextResponse.json(updated)
}
