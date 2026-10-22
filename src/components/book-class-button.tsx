"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function nextDateForDayOfWeek(dayOfWeek: number): string {
  const today = new Date()
  const diff = (dayOfWeek - today.getDay() + 7) % 7
  const target = new Date(today)
  target.setDate(today.getDate() + diff)
  return target.toISOString().slice(0, 10)
}

export function BookClassButton({ classId, dayOfWeek }: { classId: string; dayOfWeek: number }) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(() => nextDateForDayOfWeek(dayOfWeek))
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  async function book() {
    setLoading(true)
    setError("")
    const res = await fetch(`/api/member/classes/${classId}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classDate: date }),
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
    return <span className="text-xs font-medium text-primary">Booked for {date}</span>
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Book — next {DAY_NAMES[dayOfWeek]}
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="h-8 w-36 text-xs"
      />
      <Button size="sm" onClick={book} disabled={loading}>
        {loading ? "Booking…" : "Confirm"}
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
