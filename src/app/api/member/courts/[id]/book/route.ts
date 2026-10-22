import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getMemberSession } from "@/lib/member-auth/session"
import { buildKuickpayConsumerNo } from "@/lib/kuickpay-no"
import { sendPushToAccount } from "@/lib/member-auth/send-push"

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, props: Params) {
  const params = await props.params
  const session = await getMemberSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { bookingDate, startTime, endTime } = await request.json()
  if (!bookingDate || !startTime || !endTime) {
    return NextResponse.json({ error: "bookingDate, startTime and endTime are required" }, { status: 400 })
  }

  const court = await prisma.court.findFirst({ where: { id: params.id, isActive: true } })
  if (!court) return NextResponse.json({ error: "Court not found" }, { status: 404 })

  const gymLink = await prisma.memberGymLink.findFirst({
    where: { accountId: session.sub, tenantId: court.tenantId, status: "ACTIVE" },
  })
  if (!gymLink) {
    return NextResponse.json({ error: "You're not a member of this gym" }, { status: 403 })
  }

  const [tenant, member] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: court.tenantId }, select: { kuickpayInstitutionId: true } }),
    prisma.member.findUnique({ where: { id: gymLink.memberId }, select: { consumerNumber: true } }),
  ])

  const dateStart = new Date(bookingDate + "T00:00:00.000Z")
  const dateEnd = new Date(bookingDate + "T23:59:59.999Z")

  const conflict = await prisma.slotBooking.findFirst({
    where: {
      courtId: court.id,
      status: "CONFIRMED",
      bookingDate: { gte: dateStart, lte: dateEnd },
      AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
    },
  })
  if (conflict) {
    return NextResponse.json({ error: "That time slot is already booked" }, { status: 409 })
  }

  const totalAmount = Number(court.pricePerSlot)
  const kuickpayConsumerNo = buildKuickpayConsumerNo(tenant?.kuickpayInstitutionId, member?.consumerNumber ?? null)

  const booking = await prisma.$transaction(async (tx) => {
    const b = await tx.slotBooking.create({
      data: {
        tenantId: court.tenantId,
        courtId: court.id,
        memberId: gymLink.memberId,
        bookingDate: dateStart,
        startTime,
        endTime,
        durationSlots: 1,
        totalAmount,
        paymentStatus: "PENDING",
        kuickpayConsumerNo,
      },
    })
    await tx.invoice.create({
      data: {
        tenantId: court.tenantId,
        memberId: gymLink.memberId,
        slotBookingId: b.id,
        type: "COURT_BOOKING",
        description: `${court.name}${court.sport ? ` (${court.sport})` : ""} — ${bookingDate} ${startTime}–${endTime}`,
        subtotal: totalAmount,
        discount: 0,
        total: totalAmount,
        paymentStatus: "PENDING",
        kuickpayConsumerNo,
      },
    })
    return b
  })

  sendPushToAccount(session.sub, {
    title: "Court booked",
    body: `${court.name} — ${bookingDate} ${startTime}–${endTime}`,
    url: "/portal/courts",
  }).catch(() => {})

  return NextResponse.json(booking, { status: 201 })
}
