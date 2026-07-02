"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react"
import { NewBookingForm } from "./new-booking-form"

type Court = {
  id: string
  name: string
  sport: string | null
  pricePerSlot: number
  slotDuration: number
  openTime: string
  closeTime: string
}

type Booking = {
  id: string
  courtId: string
  memberId: string | null
  customerName: string | null
  customerPhone: string | null
  bookingDate: Date | string
  startTime: string
  endTime: string
  durationSlots: number
  totalAmount: number
  paidAmount: number
  paymentStatus: string
  paymentMethod: string | null
  status: string
  notes: string | null
  court: { id: string; name: string }
  member: { id: string; firstName: string; lastName: string } | null
}

type Member = {
  id: string
  firstName: string
  lastName: string
  phone: string | null
}

type Props = {
  courts: Court[]
  bookings: Booking[]
  members: Member[]
  currentDate: string
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`
}

function parseMinutes(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00")
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
}

// Convert raw minutes (may exceed 1440) back to a "HH:MM" string
function minutesToTime(m: number): string {
  const wrapped = ((m % 1440) + 1440) % 1440
  return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`
}

// Build hourly time slots from the earliest openTime to the latest closeTime across all courts.
// Handles courts that close past midnight (e.g. 15:00–03:00).
function buildTimeSlots(courts: Court[]): string[] {
  if (courts.length === 0) return []
  let minOpen = Infinity
  let maxClose = -Infinity
  for (const c of courts) {
    const open = parseMinutes(c.openTime)
    let close = parseMinutes(c.closeTime)
    if (close <= open) close += 1440  // e.g. 03:00 → 27:00
    if (open < minOpen) minOpen = open
    if (close > maxClose) maxClose = close
  }
  const slots: string[] = []
  for (let m = minOpen; m < maxClose; m += 60) {
    slots.push(minutesToTime(m))
  }
  return slots
}

// Returns true if slotTime falls within court's operating hours, handles past-midnight close
function isCourtOpen(court: Court, slotTime: string): boolean {
  const open = parseMinutes(court.openTime)
  const slot = parseMinutes(slotTime)
  const close = parseMinutes(court.closeTime)
  if (close <= open) {
    // Wraps midnight: open if slot >= open OR slot < close
    return slot >= open || slot < close
  }
  return slot >= open && slot < close
}

export function BookingGrid({ courts, bookings, members, currentDate }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [prefill, setPrefill] = useState<{ courtId?: string; startTime?: string } | null>(null)
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const timeSlots = useMemo(() => buildTimeSlots(courts), [courts])

  // Map bookings by courtId -> list
  const bookingsByCourtId = useMemo(() => {
    const map: Record<string, Booking[]> = {}
    for (const b of bookings) {
      if (!map[b.courtId]) map[b.courtId] = []
      map[b.courtId].push(b)
    }
    return map
  }, [bookings])

  function navDate(delta: number) {
    const newDate = addDays(currentDate, delta)
    router.push(`/dashboard/bookings?date=${newDate}`)
  }

  function handleCellClick(courtId: string, slotTime: string) {
    setPrefill({ courtId, startTime: slotTime })
    setShowForm(true)
  }

  function handleNewBooking() {
    setPrefill(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setPrefill(null)
  }

  async function cancelBooking(bookingId: string) {
    setUpdatingId(bookingId)
    await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    })
    setDetailBooking(null)
    setUpdatingId(null)
    router.refresh()
  }

  // Determine which timeslot a booking occupies (for rendering spans).
  // Handles past-midnight bookings (e.g. startTime "23:00", endTime "01:00").
  function getBookingForCell(courtId: string, slotTime: string): Booking | null {
    const courtBookings = bookingsByCourtId[courtId] || []
    const slot = parseMinutes(slotTime)
    for (const b of courtBookings) {
      if (b.status === "CANCELLED") continue
      const start = parseMinutes(b.startTime)
      let end = parseMinutes(b.endTime)
      if (end <= start) end += 1440  // booking crosses midnight
      // Normalise slot into same 48-hour window as this booking
      const normSlot = slot < start ? slot + 1440 : slot
      if (normSlot >= start && normSlot < end) return b
    }
    return null
  }

  // Returns true if this slot is the first slot of a booking (so we render it)
  function isBookingStart(booking: Booking, slotTime: string): boolean {
    return booking.startTime === slotTime
  }

  function getBookingRowSpan(booking: Booking): number {
    const start = parseMinutes(booking.startTime)
    let end = parseMinutes(booking.endTime)
    if (end <= start) end += 1440  // crosses midnight
    return Math.ceil((end - start) / 60)
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "CONFIRMED": return "bg-emerald-50 border-emerald-200 text-emerald-800"
      case "CANCELLED": return "bg-gray-50 border-gray-200 text-gray-500"
      case "COMPLETED": return "bg-blue-50 border-blue-200 text-blue-800"
      case "NO_SHOW": return "bg-orange-50 border-orange-200 text-orange-700"
      default: return "bg-secondary border-border text-foreground"
    }
  }

  const today = new Date().toISOString().split("T")[0]

  return (
    <>
      {/* Header controls */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navDate(-1)}
            className="rounded-md border border-border p-2 text-muted-foreground hover:bg-muted/40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <input
              type="date"
              value={currentDate}
              onChange={(e) => router.push(`/dashboard/bookings?date=${e.target.value}`)}
              className="rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="mt-0.5 text-xs text-muted-foreground">{formatDateDisplay(currentDate)}</p>
          </div>
          <button
            onClick={() => navDate(1)}
            className="rounded-md border border-border p-2 text-muted-foreground hover:bg-muted/40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {currentDate !== today && (
            <button
              onClick={() => router.push(`/dashboard/bookings?date=${today}`)}
              className="rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/40"
            >
              Today
            </button>
          )}
        </div>
        <button
          onClick={handleNewBooking}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Booking
        </button>
      </div>

      {courts.length === 0 ? (
        <div className="rounded-lg border border-border bg-white p-16 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">No active courts configured.</p>
          <a href="/dashboard/courts" className="mt-2 inline-block text-sm text-primary hover:underline">
            Set up courts first
          </a>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-white shadow-sm overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: `${courts.length * 160 + 80}px` }}>
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="w-20 py-3 px-3 text-left text-xs font-semibold text-muted-foreground sticky left-0 bg-muted/30">
                  Time
                </th>
                {courts.map((court) => (
                  <th key={court.id} className="py-3 px-3 text-left text-xs font-semibold text-foreground">
                    <div>{court.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {court.sport && (
                        <span className="text-[10px] font-normal text-muted-foreground">{court.sport}</span>
                      )}
                      {court.pricePerSlot > 0 && (
                        <span className="text-[10px] font-normal text-primary">
                          {court.sport ? "·" : ""} PKR {court.pricePerSlot.toLocaleString("en-PK")}/{court.slotDuration}min
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slotTime, rowIdx) => {
                return (
                  <tr key={slotTime} className={rowIdx % 2 === 0 ? "bg-white" : "bg-muted/10"}>
                    <td className="py-2 px-3 text-xs text-muted-foreground border-b border-border/50 sticky left-0 bg-inherit whitespace-nowrap">
                      {formatTime(slotTime)}
                    </td>
                    {courts.map((court) => {
                      const booking = getBookingForCell(court.id, slotTime)

                      if (booking && !isBookingStart(booking, slotTime)) {
                        // This cell is covered by a booking that started in a previous row — skip (rowspan handles it)
                        return null
                      }

                      if (booking && isBookingStart(booking, slotTime)) {
                        const rowspan = getBookingRowSpan(booking)
                        const displayName = booking.member
                          ? `${booking.member.firstName} ${booking.member.lastName}`
                          : booking.customerName || "Walk-in"
                        return (
                          <td
                            key={court.id}
                            rowSpan={rowspan}
                            className="py-1 px-1 border-b border-border/50 align-top"
                          >
                            <button
                              onClick={() => setDetailBooking(booking)}
                              className={`w-full h-full rounded border p-1.5 text-left text-xs transition-opacity hover:opacity-80 ${getStatusColor(booking.status)}`}
                              style={{ minHeight: `${rowspan * 41}px` }}
                            >
                              <div className="font-semibold truncate">{displayName}</div>
                              <div className="text-[10px] opacity-70">{formatTime(booking.startTime)} – {formatTime(booking.endTime)}</div>
                              {booking.customerPhone && (
                                <div className="text-[10px] opacity-70 truncate">{booking.customerPhone}</div>
                              )}
                            </button>
                          </td>
                        )
                      }

                      // Empty cell — clickable
                      const isOpen = isCourtOpen(court, slotTime)

                      return (
                        <td
                          key={court.id}
                          className="py-1 px-1 border-b border-border/50"
                        >
                          {isOpen ? (
                            <button
                              onClick={() => handleCellClick(court.id, slotTime)}
                              className="group flex w-full h-full min-h-[36px] items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-primary transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ) : (
                            <div className="min-h-[36px] bg-muted/20 rounded" />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Booking detail sidebar */}
      {detailBooking && (
        <div className="fixed inset-0 z-40 flex" onClick={() => setDetailBooking(null)}>
          <div className="flex-1" />
          <div
            className="w-80 h-full bg-white border-l border-border shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-semibold text-foreground">Booking Details</h3>
              <button onClick={() => setDetailBooking(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Court</p>
                <p className="text-sm font-medium text-foreground">{detailBooking.court.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="text-sm font-medium text-foreground">
                  {formatTime(detailBooking.startTime)} – {formatTime(detailBooking.endTime)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="text-sm font-medium text-foreground">
                  {detailBooking.member
                    ? `${detailBooking.member.firstName} ${detailBooking.member.lastName}`
                    : detailBooking.customerName || "—"}
                </p>
                {detailBooking.customerPhone && (
                  <p className="text-xs text-muted-foreground">{detailBooking.customerPhone}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-sm font-medium text-foreground">
                    PKR {detailBooking.totalAmount.toLocaleString("en-PK")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Paid</p>
                  <p className="text-sm font-medium text-foreground">
                    PKR {detailBooking.paidAmount.toLocaleString("en-PK")}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    detailBooking.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700" :
                    detailBooking.status === "CANCELLED" ? "bg-gray-100 text-gray-600" :
                    detailBooking.status === "COMPLETED" ? "bg-blue-100 text-blue-700" :
                    "bg-orange-100 text-orange-700"
                  }`}>
                    {detailBooking.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment</p>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    detailBooking.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-700" :
                    detailBooking.paymentStatus === "PARTIAL" ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {detailBooking.paymentStatus}
                  </span>
                </div>
              </div>
              {detailBooking.paymentMethod && (
                <div>
                  <p className="text-xs text-muted-foreground">Payment Method</p>
                  <p className="text-sm text-foreground">{detailBooking.paymentMethod.replace(/_/g, " ")}</p>
                </div>
              )}
              {detailBooking.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm text-foreground">{detailBooking.notes}</p>
                </div>
              )}

              {detailBooking.status === "CONFIRMED" && (
                <div className="pt-2 border-t border-border space-y-2">
                  <button
                    onClick={async () => {
                      setUpdatingId(detailBooking.id)
                      await fetch(`/api/bookings/${detailBooking.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "COMPLETED", paymentStatus: "PAID", paidAmount: detailBooking.totalAmount }),
                      })
                      setDetailBooking(null)
                      setUpdatingId(null)
                      router.refresh()
                    }}
                    disabled={updatingId === detailBooking.id}
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                  >
                    Mark Completed & Paid
                  </button>
                  <button
                    onClick={() => cancelBooking(detailBooking.id)}
                    disabled={updatingId === detailBooking.id}
                    className="w-full rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40 disabled:opacity-50"
                  >
                    Cancel Booking
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New booking form */}
      {showForm && (
        <NewBookingForm
          courts={courts}
          members={members}
          currentDate={currentDate}
          prefill={prefill}
          onClose={closeForm}
          onSuccess={() => {
            closeForm()
            router.refresh()
          }}
        />
      )}
    </>
  )
}
