import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const assignments = await prisma.trainerMemberAssignment.findMany({
    where: { trainerId: params.id, tenantId: session.tenantId, status: "ACTIVE" },
    include: {
      member: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      branch: { select: { id: true, name: true } },
      slot: { select: { dayOfWeek: true, startTime: true, endTime: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(assignments)
}

export async function POST(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const trainer = await prisma.staff.findFirst({
    where: { id: params.id, tenantId: session.tenantId, role: "TRAINER" },
  })
  if (!trainer) return NextResponse.json({ error: "Trainer not found" }, { status: 404 })

  const body = await request.json()
  const { memberId, branchId, slotId, startDate, notes } = body

  if (!memberId || !branchId || !startDate) {
    return NextResponse.json({ error: "memberId, branchId, startDate required" }, { status: 400 })
  }

  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId: session.tenantId },
  })
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })

  // Check slot capacity if slot provided
  if (slotId) {
    const slot = await prisma.trainerSlot.findFirst({
      where: { id: slotId, trainerId: params.id },
      include: { _count: { select: { assignments: { where: { status: "ACTIVE" } } } } },
    })
    if (!slot) return NextResponse.json({ error: "Slot not found" }, { status: 404 })
    if (slot._count.assignments >= slot.capacity) {
      return NextResponse.json(
        { error: `This slot is full (${slot.capacity}/${slot.capacity} members)` },
        { status: 409 }
      )
    }
  }

  // Check member isn't already assigned to this trainer
  const duplicate = await prisma.trainerMemberAssignment.findFirst({
    where: { trainerId: params.id, memberId, status: "ACTIVE" },
  })
  if (duplicate) {
    return NextResponse.json({ error: "Member is already assigned to this trainer" }, { status: 409 })
  }

  const assignment = await prisma.trainerMemberAssignment.create({
    data: {
      tenantId: session.tenantId,
      trainerId: params.id,
      memberId,
      branchId,
      slotId: slotId || null,
      startDate: new Date(startDate),
      notes: notes || null,
    },
    include: {
      member: { select: { id: true, firstName: true, lastName: true } },
      branch: { select: { id: true, name: true } },
      slot: { select: { dayOfWeek: true, startTime: true, endTime: true } },
    },
  })

  return NextResponse.json(assignment, { status: 201 })
}
