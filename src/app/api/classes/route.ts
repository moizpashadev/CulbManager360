import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function GET() {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const classes = await prisma.classSchedule.findMany({
    where: { tenantId: session.tenantId },
    include: {
      instructor: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  })
  return NextResponse.json(classes)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!["OWNER", "ADMIN", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const body = await request.json()
  const { title, description, instructorId, dayOfWeek, startTime, endTime, capacity } = body

  if (!title || !dayOfWeek || !startTime || !endTime) {
    return NextResponse.json({ error: "title, dayOfWeek, startTime and endTime are required" }, { status: 400 })
  }

  const cls = await prisma.classSchedule.create({
    data: {
      tenantId: session.tenantId,
      title,
      description: description || null,
      instructorId: instructorId || null,
      dayOfWeek: parseInt(dayOfWeek),
      startTime,
      endTime,
      capacity: capacity ? parseInt(capacity) : 20,
    },
    include: {
      instructor: { select: { id: true, firstName: true, lastName: true } },
    },
  })
  return NextResponse.json(cls, { status: 201 })
}
