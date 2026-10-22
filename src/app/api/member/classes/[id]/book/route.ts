import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getMemberSession } from "@/lib/member-auth/session"

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, props: Params) {
  const params = await props.params
  const session = await getMemberSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { classDate } = await request.json()
  if (!classDate) {
    return NextResponse.json({ error: "classDate is required" }, { status: 400 })
  }

  const cls = await prisma.classSchedule.findFirst({ where: { id: params.id, isActive: true } })
  if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 })

  // A member can only book for themselves, and only at a gym they're
  // actually linked to — resolve their tenant-scoped Member.id server-side,
  // never trust a memberId from the client.
  const gymLink = await prisma.memberGymLink.findFirst({
    where: { accountId: session.sub, tenantId: cls.tenantId, status: "ACTIVE" },
  })
  if (!gymLink) {
    return NextResponse.json({ error: "You're not a member of this gym" }, { status: 403 })
  }

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
      data: { scheduleId: params.id, memberId: gymLink.memberId, classDate: date, status: "CONFIRMED" },
    })
    return NextResponse.json(booking, { status: 201 })
  } catch {
    return NextResponse.json({ error: "You're already booked for this class" }, { status: 409 })
  }
}
