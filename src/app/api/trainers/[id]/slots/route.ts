import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const slots = await prisma.trainerSlot.findMany({
    where: { trainerId: params.id, isActive: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    include: {
      branch: { select: { id: true, name: true } },
      _count: { select: { assignments: { where: { status: "ACTIVE" } } } },
    },
  })

  return NextResponse.json(slots)
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
  const { branchId, dayOfWeek, startTime, endTime, capacity = 1 } = body

  if (branchId === undefined || dayOfWeek === undefined || !startTime || !endTime) {
    return NextResponse.json({ error: "branchId, dayOfWeek, startTime, endTime required" }, { status: 400 })
  }

  const branch = await prisma.branch.findFirst({
    where: { id: branchId, tenantId: session.tenantId },
  })
  if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 })

  const slot = await prisma.trainerSlot.create({
    data: {
      tenantId: session.tenantId,
      trainerId: params.id,
      branchId,
      dayOfWeek: parseInt(dayOfWeek),
      startTime,
      endTime,
      capacity: parseInt(capacity),
    },
    include: {
      branch: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(slot, { status: 201 })
}
