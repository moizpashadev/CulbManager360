import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

type Params = { params: { id: string } }

export async function GET(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cls = await prisma.classSchedule.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
  })
  if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const dateStr = searchParams.get("date")
  const classDate = dateStr ? new Date(dateStr) : new Date()
  classDate.setHours(0, 0, 0, 0)

  const bookings = await prisma.classBooking.findMany({
    where: { scheduleId: params.id, classDate },
    include: { member: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(bookings)
}

export async function POST(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cls = await prisma.classSchedule.findFirst({
    where: { id: params.id, tenantId: session.tenantId, isActive: true },
  })
  if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 })

  const body = await request.json()
  const { memberId, classDate } = body

  if (!memberId || !classDate) {
    return NextResponse.json({ error: "memberId and classDate are required" }, { status: 400 })
  }

  // Verify member belongs to tenant
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId: session.tenantId },
  })
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })

  // Check capacity
  const date = new Date(classDate)
  date.setHours(0, 0, 0, 0)
  const currentBookings = await prisma.classBooking.count({
    where: { scheduleId: params.id, classDate: date, status: "CONFIRMED" },
  })
  if (currentBookings >= cls.capacity) {
    return NextResponse.json({ error: "Class is full" }, { status: 409 })
  }

  try {
    const booking = await prisma.classBooking.create({
      data: { scheduleId: params.id, memberId, classDate: date, status: "CONFIRMED" },
      include: { member: { select: { firstName: true, lastName: true } } },
    })
    return NextResponse.json(booking, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Member already booked for this class" }, { status: 409 })
  }
}
