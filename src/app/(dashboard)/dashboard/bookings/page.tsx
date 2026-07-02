import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { BookingGrid } from "./booking-grid"

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: { date?: string }
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const today = new Date().toISOString().split("T")[0]
  const dateStr = searchParams.date || today

  const dateStart = new Date(dateStr + "T00:00:00.000Z")
  const dateEnd = new Date(dateStr + "T23:59:59.999Z")

  const [courts, bookings, members] = await Promise.all([
    prisma.court.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.slotBooking.findMany({
      where: {
        tenantId: session.tenantId,
        bookingDate: { gte: dateStart, lte: dateEnd },
      },
      include: {
        court: { select: { id: true, name: true } },
        member: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ courtId: "asc" }, { startTime: "asc" }],
    }),
    prisma.member.findMany({
      where: { tenantId: session.tenantId, status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true, phone: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Court Bookings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {bookings.filter((b) => b.status === "CONFIRMED").length} confirmed booking{bookings.filter((b) => b.status === "CONFIRMED").length !== 1 ? "s" : ""} for {dateStr}
        </p>
      </div>

      <BookingGrid
        courts={courts.map((c) => ({
          ...c,
          pricePerSlot: Number(c.pricePerSlot),
        }))}
        bookings={bookings.map((b) => ({
          ...b,
          totalAmount: Number(b.totalAmount),
          paidAmount: Number(b.paidAmount),
        }))}
        members={members}
        currentDate={dateStr}
      />
    </div>
  )
}
