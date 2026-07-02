"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

type Trainer = { id: string; firstName: string; lastName: string; role: string }

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
]

export function NewClassForm({ trainers }: { trainers: Trainer[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedDays, setSelectedDays] = useState<number[]>([])

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (selectedDays.length === 0) {
      setError("Select at least one day")
      return
    }
    setLoading(true)
    setError("")

    const fd = new FormData(e.currentTarget)

    // Create one schedule per selected day
    const results = await Promise.all(
      selectedDays.map((day) =>
        fetch("/api/classes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: fd.get("title"),
            description: fd.get("description") || null,
            instructorId: fd.get("instructorId") || null,
            dayOfWeek: day,
            startTime: fd.get("startTime"),
            endTime: fd.get("endTime"),
            capacity: fd.get("capacity"),
          }),
        })
      )
    )

    const failed = results.find((r) => !r.ok)
    if (failed) {
      const data = await failed.json()
      setError(data.error ?? "Failed to create class")
      setLoading(false)
      return
    }

    router.push("/dashboard/classes")
    router.refresh()
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard/classes">
          <button className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Schedule New Class</h1>
          <p className="text-sm text-muted-foreground">Add a recurring class to your weekly schedule</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-lg border border-border bg-white shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-medium text-foreground">Class Details</h2>
          </div>
          <div className="space-y-4 p-6">
            <div className="space-y-1.5">
              <label htmlFor="title" className="block text-sm font-medium text-foreground">
                Class Name <span className="text-destructive">*</span>
              </label>
              <input
                id="title" name="title" required placeholder="Yoga · HIIT · Spinning…"
                className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="description" className="block text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                id="description" name="description" rows={2}
                placeholder="Brief description of the class…"
                className="block w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="instructorId" className="block text-sm font-medium text-foreground">
                Instructor
              </label>
              <select
                id="instructorId" name="instructorId"
                className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">— No instructor assigned —</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.firstName} {t.lastName} ({t.role.toLowerCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="startTime" className="block text-sm font-medium text-foreground">
                  Start Time <span className="text-destructive">*</span>
                </label>
                <input
                  id="startTime" name="startTime" type="time" required defaultValue="09:00"
                  className="block w-full rounded-md border border-border bg-white px-3 py-2 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="endTime" className="block text-sm font-medium text-foreground">
                  End Time <span className="text-destructive">*</span>
                </label>
                <input
                  id="endTime" name="endTime" type="time" required defaultValue="10:00"
                  className="block w-full rounded-md border border-border bg-white px-3 py-2 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="capacity" className="block text-sm font-medium text-foreground">
                Capacity
              </label>
              <input
                id="capacity" name="capacity" type="number" min="1" defaultValue="20"
                className="block w-32 rounded-md border border-border bg-white px-3 py-2 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Day picker */}
        <div className="rounded-lg border border-border bg-white shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-medium text-foreground">
              Repeat on Days <span className="text-destructive">*</span>
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Select all days this class runs weekly</p>
          </div>
          <div className="flex flex-wrap gap-2 p-6">
            {DAYS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                  selectedDays.includes(d.value)
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white text-foreground hover:bg-muted/50"
                }`}
              >
                {d.label.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Scheduling…" : `Schedule Class${selectedDays.length > 1 ? ` (${selectedDays.length} days)` : ""}`}
          </Button>
          <Link href="/dashboard/classes">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
