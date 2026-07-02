import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

type Params = { params: { id: string } }

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const existing = await prisma.slotBooking.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
  })
  if (!existing) return NextResponse.json({ error: "Booking not found" }, { status: 404 })

  const body = await request.json()
  const { status, paymentStatus, paymentMethod, paidAmount, notes } = body

  const updated = await prisma.slotBooking.update({
    where: { id: params.id },
    data: {
      status: status ?? existing.status,
      paymentStatus: paymentStatus ?? existing.paymentStatus,
      paymentMethod: paymentMethod !== undefined ? (paymentMethod || null) : existing.paymentMethod,
      paidAmount: paidAmount != null ? Number(paidAmount) : existing.paidAmount,
      notes: notes !== undefined ? (notes || null) : existing.notes,
    },
    include: {
      court: { select: { id: true, name: true } },
      member: { select: { id: true, firstName: true, lastName: true } },
    },
  })
  return NextResponse.json(updated)
}
