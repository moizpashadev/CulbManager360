import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

function esc(v: unknown) {
  const s = v == null ? "" : String(v)
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") ?? undefined
  const status = searchParams.get("status") ?? undefined
  const type = searchParams.get("type") ?? undefined
  const memberId = searchParams.get("memberId") ?? undefined

  const where: Record<string, unknown> = { tenantId: session.tenantId }
  if (memberId) where.memberId = memberId
  if (status) where.paymentStatus = status
  if (type) where.type = type
  if (q) {
    where.member = {
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
      ],
    }
  }

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { member: { select: { firstName: true, lastName: true, consumerNumber: true } } },
  })

  const headers = [
    "Date", "Member", "Consumer #", "Type", "Description",
    "Subtotal", "Discount", "Total", "Paid Amount", "Status", "Method", "Paid At",
  ]
  const rows = invoices.map((inv) => [
    new Date(inv.createdAt).toLocaleDateString("en-PK"),
    inv.member ? `${inv.member.firstName} ${inv.member.lastName}` : "Walk-in",
    inv.member?.consumerNumber ?? "",
    inv.type,
    inv.description ?? "",
    Number(inv.subtotal),
    Number(inv.discount),
    Number(inv.total),
    Number(inv.paidAmount),
    inv.paymentStatus,
    inv.paymentMethod ?? "",
    inv.paidAt ? new Date(inv.paidAt).toLocaleDateString("en-PK") : "",
  ])

  const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n")
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="billing-${date}.csv"`,
    },
  })
}
