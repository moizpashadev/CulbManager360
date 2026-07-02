"use client"

import { useState, useMemo, useEffect } from "react"
import { X } from "lucide-react"

type Court = {
  id: string
  name: string
  sport: string | null
  pricePerSlot: number
  slotDuration: number
  openTime: string
  closeTime: string
}

type Member = {
  id: string
  firstName: string
  lastName: string
  phone: string | null
}

type Props = {
  courts: Court[]
  members: Member[]
  currentDate: string
  prefill: { courtId?: string; startTime?: string } | null
  onClose: () => void
  onSuccess: () => void
}

const PAYMENT_METHODS = [
  { value: "", label: "Record later" },
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "EASYPAISA", label: "Easypaisa" },
  { value: "JAZZCASH", label: "JazzCash" },
  { value: "CARD", label: "Card" },
]

function parseMinutes(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

// Wraps minutes past 1440 back into a valid 00:00–23:59 time string
function minutesToTime(m: number): string {
  const wrapped = ((m % 1440) + 1440) % 1440
  const h = Math.floor(wrapped / 60)
  const min = wrapped % 60
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`
}

function buildSlotOptions(court: Court): string[] {
  const open = parseMinutes(court.openTime)
  let close = parseMinutes(court.closeTime)
  // Past midnight: e.g. open=15:00 (900), close=03:00 (180) → extend close to 27:00 (1620)
  if (close <= open) close += 1440
  const slots: string[] = []
  for (let m = open; m < close; m += court.slotDuration) {
    slots.push(minutesToTime(m))
  }
  return slots
}

function computeEndTime(startTime: string, court: Court, durationSlots: number): string {
  const start = parseMinutes(startTime)
  const end = start + court.slotDuration * durationSlots
  return minutesToTime(end)
}

export function NewBookingForm({ courts, members, currentDate, prefill, onClose, onSuccess }: Props) {
  const [courtId, setCourtId] = useState(prefill?.courtId || courts[0]?.id || "")
  const [date, setDate] = useState(currentDate)
  const [startTime, setStartTime] = useState(prefill?.startTime || "")
  const [durationSlots, setDurationSlots] = useState(1)
  const [memberMode, setMemberMode] = useState<"member" | "walkin">("walkin")
  const [memberSearch, setMemberSearch] = useState("")
  const [memberId, setMemberId] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [notes, setNotes] = useState("")
  const [repeatEnabled, setRepeatEnabled] = useState(false)
  const [repeatCount, setRepeatCount] = useState(4)   // total number of bookings
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const court = useMemo(() => courts.find((c) => c.id === courtId), [courts, courtId])
  const slotOptions = useMemo(() => (court ? buildSlotOptions(court) : []), [court])
  const endTime = useMemo(
    () => (court && startTime ? computeEndTime(startTime, court, durationSlots) : ""),
    [court, startTime, durationSlots]
  )
  const totalAmount = useMemo(
    () => (court ? court.pricePerSlot * durationSlots : 0),
    [court, durationSlots]
  )

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members.slice(0, 8)
    const q = memberSearch.toLowerCase()
    return members
      .filter(
        (m) =>
          m.firstName.toLowerCase().includes(q) ||
          m.lastName.toLowerCase().includes(q) ||
          (m.phone && m.phone.includes(q))
      )
      .slice(0, 8)
  }, [members, memberSearch])

  // Set first slot option when court changes or component mounts without prefill
  useEffect(() => {
    if (!prefill?.startTime && slotOptions.length > 0) {
      setStartTime(slotOptions[0])
    }
  }, [courtId, slotOptions, prefill])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!courtId || !date || !startTime) {
      setError("Court, date and start time are required.")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courtId,
          bookingDate: date,
          startTime,
          endTime,
          durationSlots,
          memberId: memberMode === "member" ? memberId || null : null,
          customerName: memberMode === "walkin" ? customerName || null : null,
          customerPhone: memberMode === "walkin" ? customerPhone || null : null,
          paymentMethod: paymentMethod || null,
          notes: notes || null,
          repeatWeeks: repeatEnabled ? repeatCount - 1 : 0,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to create booking")
        return
      }

      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  const maxDuration = (() => {
    if (!court) return 4
    const start = parseMinutes(startTime || court.openTime)
    let close = parseMinutes(court.closeTime)
    if (close <= start) close += 1440  // past midnight
    return Math.max(1, Math.floor((close - start) / court.slotDuration))
  })()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl border border-border bg-white shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 sticky top-0 bg-white">
          <h2 className="text-base font-semibold text-foreground">New Booking</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted/40">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Court */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Court <span className="text-red-500">*</span>
            </label>
            <select
              value={courtId}
              onChange={(e) => {
                setCourtId(e.target.value)
                setStartTime("")
              }}
              required
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {courts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.sport ? ` (${c.sport})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Start time + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Start Time <span className="text-red-500">*</span>
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {slotOptions.length === 0 && <option value="">No slots</option>}
                {slotOptions.map((s) => (
                  <option key={s} value={s}>{formatTime(s)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Duration</label>
              <select
                value={durationSlots}
                onChange={(e) => setDurationSlots(parseInt(e.target.value))}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {Array.from({ length: Math.min(maxDuration, 4) }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} slot{n > 1 ? "s" : ""}{court ? ` (${n * court.slotDuration} min)` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* End time + Total amount preview */}
          {court && startTime && (
            <div className="rounded-md bg-secondary px-4 py-3 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {formatTime(startTime)} – {endTime ? formatTime(endTime) : "—"}
              </div>
              <div className="text-sm font-semibold text-foreground">
                PKR {totalAmount.toLocaleString("en-PK")}
              </div>
            </div>
          )}

          {/* Customer — member or walk-in */}
          <div>
            <div className="mb-2 flex gap-2">
              <button
                type="button"
                onClick={() => { setMemberMode("walkin"); setMemberId(""); setMemberSearch("") }}
                className={`rounded-md px-3 py-1.5 text-xs font-medium border transition-colors ${
                  memberMode === "walkin"
                    ? "bg-primary text-white border-primary"
                    : "border-border text-foreground hover:bg-muted/40"
                }`}
              >
                Walk-in
              </button>
              <button
                type="button"
                onClick={() => { setMemberMode("member"); setCustomerName(""); setCustomerPhone("") }}
                className={`rounded-md px-3 py-1.5 text-xs font-medium border transition-colors ${
                  memberMode === "member"
                    ? "bg-primary text-white border-primary"
                    : "border-border text-foreground hover:bg-muted/40"
                }`}
              >
                Member
              </button>
            </div>

            {memberMode === "walkin" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Customer Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Name (optional)"
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Phone</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="03XX-XXXXXXX"
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            ) : (
              <div className="relative">
                <label className="mb-1 block text-sm font-medium text-foreground">Search Member</label>
                <input
                  type="text"
                  value={memberId ? (members.find((m) => m.id === memberId) ? `${members.find((m) => m.id === memberId)!.firstName} ${members.find((m) => m.id === memberId)!.lastName}` : memberSearch) : memberSearch}
                  onChange={(e) => {
                    setMemberSearch(e.target.value)
                    setMemberId("")
                  }}
                  placeholder="Type name or phone…"
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {!memberId && memberSearch && filteredMembers.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-white shadow-md">
                    {filteredMembers.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setMemberId(m.id)
                          setMemberSearch(`${m.firstName} ${m.lastName}`)
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary"
                      >
                        <span className="font-medium text-foreground">{m.firstName} {m.lastName}</span>
                        {m.phone && <span className="text-muted-foreground text-xs">{m.phone}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment method */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm.value} value={pm.value}>{pm.label}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              rows={2}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Recurring booking */}
          <div className="rounded-md border border-border bg-muted/20 px-4 py-3 space-y-3">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={repeatEnabled}
                onChange={(e) => setRepeatEnabled(e.target.checked)}
                className="rounded accent-primary"
              />
              <span className="text-sm font-medium text-foreground">Repeat weekly</span>
            </label>

            {repeatEnabled && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-muted-foreground whitespace-nowrap">Total bookings:</label>
                  <select
                    value={repeatCount}
                    onChange={(e) => setRepeatCount(parseInt(e.target.value))}
                    className="rounded-md border border-border bg-white px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {[2, 4, 8, 12, 24].map((n) => (
                      <option key={n} value={n}>{n} weeks</option>
                    ))}
                  </select>
                </div>
                {court && date && startTime && (
                  <p className="text-xs text-muted-foreground">
                    Books same slot every week for {repeatCount} weeks starting {date}.
                    Total: <span className="font-semibold text-foreground">PKR {(totalAmount * repeatCount).toLocaleString("en-PK")}</span>
                    {!paymentMethod && " (payment recorded later)"}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Booking…" : repeatEnabled ? `Confirm ${repeatCount} Bookings` : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
