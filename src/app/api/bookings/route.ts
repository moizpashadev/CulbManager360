import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { buildKuickpayConsumerNo } from "@/lib/kuickpay-no"

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const dateStr = searchParams.get("date")

  let dateStart: Date
  let dateEnd: Date

  if (dateStr) {
    dateStart = new Date(dateStr + "T00:00:00.000Z")
    dateEnd = new Date(dateStr + "T23:59:59.999Z")
  } else {
    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]
    dateStart = new Date(todayStr + "T00:00:00.000Z")
    dateEnd = new Date(todayStr + "T23:59:59.999Z")
  }

  const bookings = await prisma.slotBooking.findMany({
    where: {
      tenantId: session.tenantId,
      bookingDate: { gte: dateStart, lte: dateEnd },
    },
    include: {
      court: { select: { id: true, name: true, sport: true } },
      member: { select: { id: true, firstName: true, lastName: true, phone: true } },
    },
    orderBy: [{ courtId: "asc" }, { startTime: "asc" }],
  })
  return NextResponse.json(bookings)
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatDateStr(date: Date): string {
  return date.toISOString().split("T")[0]
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const {
    courtId,
    bookingDate,
    startTime,
    endTime,
    durationSlots,
    memberId,
    customerName,
    customerPhone,
    paymentMethod,
    notes,
    repeatWeeks,  // optional: number of additional weeks (e.g. 3 = book for 4 dates total)
  } = body

  if (!courtId || !bookingDate || !startTime || !endTime) {
    return NextResponse.json(
      { error: "courtId, bookingDate, startTime and endTime are required" },
      { status: 400 }
    )
  }

  const [court, tenant, member] = await Promise.all([
    prisma.court.findFirst({ where: { id: courtId, tenantId: session.tenantId, isActive: true } }),
    prisma.tenant.findUnique({ where: { id: session.tenantId }, select: { kuickpayInstitutionId: true } }),
    memberId
      ? prisma.member.findFirst({ where: { id: memberId, tenantId: session.tenantId }, select: { consumerNumber: true } })
      : Promise.resolve(null),
  ])
  if (!court) return NextResponse.json({ error: "Court not found" }, { status: 404 })

  const kuickpayConsumerNo = buildKuickpayConsumerNo(
    tenant?.kuickpayInstitutionId,
    member?.consumerNumber ?? null,
  )

  const slots = durationSlots ? parseInt(durationSlots) : 1
  const totalAmount = Number(court.pricePerSlot) * slots
  const isPaid = Boolean(paymentMethod)

  // Build the list of dates for this booking (1 for single, N+1 for recurring)
  const weeks = repeatWeeks ? Math.min(parseInt(repeatWeeks), 51) : 0
  const baseDate = new Date(bookingDate + "T00:00:00.000Z")
  const dates: Date[] = [baseDate]
  for (let w = 1; w <= weeks; w++) {
    dates.push(addDays(baseDate, w * 7))
  }

  // Conflict check across all dates at once
  const conflictChecks = dates.map((d) => ({
    courtId,
    status: "CONFIRMED" as const,
    bookingDate: { gte: new Date(formatDateStr(d) + "T00:00:00.000Z"), lte: new Date(formatDateStr(d) + "T23:59:59.999Z") },
    AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
  }))

  const conflict = await prisma.slotBooking.findFirst({ where: { OR: conflictChecks } })
  if (conflict) {
    const conflictDate = conflict.bookingDate.toLocaleDateString("en-PK", { day: "numeric", month: "short" })
    return NextResponse.json(
      { error: `Time slot conflict on ${conflictDate} for the selected court` },
      { status: 409 }
    )
  }

  // Create all bookings + invoices in a transaction
  const createdBookings = await prisma.$transaction(async (tx) => {
    const results = []
    for (const date of dates) {
      const dateStart = new Date(formatDateStr(date) + "T00:00:00.000Z")
      const dateLabel = date.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })

      // Walk-ins get a fresh timestamp-based number per booking so they're unique
      const bookingConsumerNo = memberId
        ? kuickpayConsumerNo
        : buildKuickpayConsumerNo(tenant?.kuickpayInstitutionId, null)

      const booking = await tx.slotBooking.create({
        data: {
          tenantId: session.tenantId,
          courtId,
          memberId: memberId || null,
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          bookingDate: dateStart,
          startTime,
          endTime,
          durationSlots: slots,
          totalAmount,
          paymentStatus: isPaid ? "PAID" : "PENDING",
          paymentMethod: paymentMethod || null,
          paidAmount: isPaid ? totalAmount : 0,
          notes: notes || null,
          kuickpayConsumerNo: bookingConsumerNo,
        },
        include: {
          court: { select: { id: true, name: true, sport: true } },
          member: { select: { id: true, firstName: true, lastName: true } },
        },
      })

      await tx.invoice.create({
        data: {
          tenantId: session.tenantId,
          memberId: memberId || null,
          slotBookingId: booking.id,
          type: "COURT_BOOKING",
          description: `${court.name}${court.sport ? ` (${court.sport})` : ""} — ${dateLabel} ${startTime}–${endTime}`,
          subtotal: totalAmount,
          discount: 0,
          total: totalAmount,
          paidAmount: isPaid ? totalAmount : 0,
          paymentStatus: isPaid ? "PAID" : "PENDING",
          paymentMethod: paymentMethod || null,
          paidAt: isPaid ? new Date() : null,
          kuickpayConsumerNo: bookingConsumerNo,
        },
      })

      results.push(booking)
    }
    return results
  })

  // Return single booking or array depending on whether it was recurring
  return NextResponse.json(weeks > 0 ? createdBookings : createdBookings[0], { status: 201 })
}
