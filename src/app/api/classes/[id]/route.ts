import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

type Params = { params: { id: string } }

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const existing = await prisma.classSchedule.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
  })
  if (!existing) return NextResponse.json({ error: "Class not found" }, { status: 404 })

  const body = await request.json()
  const { title, description, instructorId, dayOfWeek, startTime, endTime, capacity, isActive } = body

  const updated = await prisma.classSchedule.update({
    where: { id: params.id },
    data: {
      title: title ?? existing.title,
      description: description !== undefined ? (description || null) : existing.description,
      instructorId: instructorId !== undefined ? (instructorId || null) : existing.instructorId,
      dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek) : existing.dayOfWeek,
      startTime: startTime ?? existing.startTime,
      endTime: endTime ?? existing.endTime,
      capacity: capacity !== undefined ? parseInt(capacity) : existing.capacity,
      isActive: isActive !== undefined ? isActive : existing.isActive,
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const existing = await prisma.classSchedule.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
  })
  if (!existing) return NextResponse.json({ error: "Class not found" }, { status: 404 })

  await prisma.classSchedule.update({ where: { id: params.id }, data: { isActive: false } })
  return NextResponse.json({ ok: true })
}
