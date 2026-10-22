"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number)
  const total = h * 60 + m + minutes
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
}

export function BookCourtButton({
  courtId,
  openTime,
  closeTime,
  slotDuration,
}: {
  courtId: string
  openTime: string
  closeTime: string
  slotDuration: number
}) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [startTime, setStartTime] = useState(openTime)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  const endTime = addMinutes(startTime, slotDuration)

  async function book() {
    setLoading(true)
    setError("")
    const res = await fetch(`/api/member/courts/${courtId}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingDate: date, startTime, endTime }),
    })
    setLoading(false)
    if (res.ok) {
      setDone(true)
      setOpen(false)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Failed to book")
    }
  }

  if (done) {
    return <span className="text-xs font-medium text-primary">Booked {date} {startTime}–{endTime}</span>
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Book a slot
      </Button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 w-36 text-xs" />
      <Input
        type="time"
        value={startTime}
        min={openTime}
        max={closeTime}
        onChange={(e) => setStartTime(e.target.value)}
        className="h-8 w-28 text-xs"
      />
      <span className="text-xs text-muted-foreground">→ {endTime}</span>
      <Button size="sm" onClick={book} disabled={loading}>
        {loading ? "Booking…" : "Confirm"}
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
