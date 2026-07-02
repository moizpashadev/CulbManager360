import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

type Params = { params: { id: string } }

// POST = check in
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
  const { branchId, notes } = body
  if (!branchId) return NextResponse.json({ error: "branchId required" }, { status: 400 })

  // Verify branch belongs to tenant
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, tenantId: session.tenantId },
  })
  if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 })

  // Check already checked in today
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const existing = await prisma.trainerAttendance.findFirst({
    where: { trainerId: params.id, tenantId: session.tenantId, checkedInAt: { gte: today }, checkedOutAt: null },
  })
  if (existing) {
    return NextResponse.json({ error: "Trainer already checked in — check out first" }, { status: 409 })
  }

  const record = await prisma.trainerAttendance.create({
    data: {
      tenantId: session.tenantId,
      trainerId: params.id,
      branchId,
      notes: notes || null,
    },
    include: { branch: { select: { id: true, name: true } } },
  })

  return NextResponse.json(record, { status: 201 })
}

// PATCH = check out
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const openRecord = await prisma.trainerAttendance.findFirst({
    where: {
      trainerId: params.id,
      tenantId: session.tenantId,
      checkedInAt: { gte: today },
      checkedOutAt: null,
    },
  })
  if (!openRecord) {
    return NextResponse.json({ error: "No open check-in found for today" }, { status: 404 })
  }

  const updated = await prisma.trainerAttendance.update({
    where: { id: openRecord.id },
    data: { checkedOutAt: new Date() },
    include: { branch: { select: { id: true, name: true } } },
  })

  return NextResponse.json(updated)
}
