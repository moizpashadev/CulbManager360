import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

type Params = { params: { id: string; assignmentId: string } }

export async function PATCH(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const assignment = await prisma.trainerMemberAssignment.findFirst({
    where: { id: params.assignmentId, trainerId: params.id, tenantId: session.tenantId },
  })
  if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 })

  const updated = await prisma.trainerMemberAssignment.update({
    where: { id: params.assignmentId },
    data: { status: "CANCELLED", endDate: new Date() },
  })

  return NextResponse.json(updated)
}
