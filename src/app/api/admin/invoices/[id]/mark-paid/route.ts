import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function PATCH(_request: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const invoice = await prisma.platformInvoice.findUnique({ where: { id: params.id } })
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
  }

  await prisma.$transaction([
    prisma.platformInvoice.update({
      where: { id: params.id },
      data: { status: "PAID", paidAt: new Date() },
    }),
    prisma.tenant.update({
      where: { id: invoice.tenantId },
      data: { isActive: true, subscriptionStatus: "ACTIVE" },
    }),
  ])

  return NextResponse.json({ ok: true })
}
