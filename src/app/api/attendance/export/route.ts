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
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  const where: Record<string, unknown> = { tenantId: session.tenantId }
  if (from || to) {
    where.checkedInAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to + "T23:59:59") } : {}),
    }
  }

  const records = await prisma.attendance.findMany({
    where,
    orderBy: { checkedInAt: "desc" },
    include: {
      member: { select: { firstName: true, lastName: true, consumerNumber: true } },
      branch: { select: { name: true } },
    },
  })

  const headers = ["Date", "Time", "Member", "Consumer #", "Branch", "Method", "Check-Out"]
  const rows = records.map((r) => [
    new Date(r.checkedInAt).toLocaleDateString("en-PK"),
    new Date(r.checkedInAt).toLocaleTimeString("en-PK"),
    `${r.member.firstName} ${r.member.lastName}`,
    r.member.consumerNumber ?? "",
    r.branch?.name ?? "",
    r.method,
    r.checkedOutAt ? new Date(r.checkedOutAt).toLocaleTimeString("en-PK") : "",
  ])

  const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n")
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="attendance-${date}.csv"`,
    },
  })
}
