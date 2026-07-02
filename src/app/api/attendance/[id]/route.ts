import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

type Params = { params: { id: string } }

// PUT /api/attendance/:id — record check-out time
export async function PUT(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const record = await prisma.attendance.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
  })
  if (!record) return NextResponse.json({ error: "Record not found" }, { status: 404 })
  if (record.checkedOutAt) {
    return NextResponse.json({ error: "Already checked out" }, { status: 409 })
  }

  const updated = await prisma.attendance.update({
    where: { id: params.id },
    data: { checkedOutAt: new Date() },
    include: {
      member: { select: { id: true, firstName: true, lastName: true } },
    },
  })
  return NextResponse.json(updated)
}
