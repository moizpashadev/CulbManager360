import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { memberId, title, notes, trainerId } = body

  if (!memberId || !title) {
    return NextResponse.json({ error: "memberId and title are required" }, { status: 400 })
  }

  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId: session.tenantId },
  })
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })

  const report = await prisma.progressReport.create({
    data: {
      memberId,
      tenantId: session.tenantId,
      trainerId: trainerId || null,
      title,
      notes: notes || null,
    },
    include: {
      trainer: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  return NextResponse.json(report, { status: 201 })
}
