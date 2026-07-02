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

  const where: Record<string, unknown> = { tenantId: session.tenantId }
  if (status) where.status = status
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ]
  }

  const members = await prisma.member.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      memberships: {
        where: { status: "ACTIVE" },
        include: { plan: { select: { name: true } } },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  })

  const headers = ["First Name", "Last Name", "Email", "Phone", "Consumer #", "Status", "Active Plan", "Join Date"]
  const rows = members.map((m) => [
    m.firstName,
    m.lastName,
    m.email,
    m.phone ?? "",
    m.consumerNumber ?? "",
    m.status,
    m.memberships[0]?.plan.name ?? "",
    new Date(m.joinDate).toLocaleDateString("en-PK"),
  ])

  const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n")
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="members-${date}.csv"`,
    },
  })
}
