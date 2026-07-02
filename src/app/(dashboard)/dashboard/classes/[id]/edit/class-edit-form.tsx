"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const DAYS = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "7", label: "Sunday" },
]

type Trainer = { id: string; firstName: string; lastName: string }

type Props = {
  classId: string
  trainers: Trainer[]
  defaultValues: {
    title: string
    description: string
    instructorId: string
    dayOfWeek: string
    startTime: string
    endTime: string
    capacity: string
    isActive: boolean
  }
}

export function ClassEditForm({ classId, trainers, defaultValues }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(defaultValues.title)
  const [description, setDescription] = useState(defaultValues.description)
  const [instructorId, setInstructorId] = useState(defaultValues.instructorId)
  const [dayOfWeek, setDayOfWeek] = useState(defaultValues.dayOfWeek)
  const [startTime, setStartTime] = useState(defaultValues.startTime)
  const [endTime, setEndTime] = useState(defaultValues.endTime)
  const [capacity, setCapacity] = useState(defaultValues.capacity)
  const [isActive, setIsActive] = useState(defaultValues.isActive)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError("Title is required."); return }
    if (!startTime || !endTime) { setError("Start and end times are required."); return }

    setSaving(true)
    setError(null)

    const res = await fetch(`/api/classes/${classId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        instructorId: instructorId || null,
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        endTime,
        capacity: parseInt(capacity) || 20,
        isActive,
      }),
    })

    if (res.ok) {
      router.push("/dashboard/classes")
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to save.")
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Class Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Instructor</label>
        <select
          value={instructorId}
          onChange={(e) => setInstructorId(e.target.value)}
          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">— No instructor assigned —</option>
          {trainers.map((t) => (
            <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Day of Week</label>
        <select
          value={dayOfWeek}
          onChange={(e) => setDayOfWeek(e.target.value)}
          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">End Time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Capacity</label>
          <input
            type="number"
            min="1"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary"
        />
        <label htmlFor="isActive" className="text-sm text-foreground">Active (shown on weekly schedule)</label>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
        <Link href="/dashboard/classes">
          <button type="button" className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40">
            Cancel
          </button>
        </Link>
      </div>
    </form>
  )
}
