"use client"

import { useState } from "react"
import { Plus, ChevronDown, ChevronUp } from "lucide-react"

type Trainer = { id: string; firstName: string; lastName: string }

type Entry = {
  id: string
  date: string | Date
  weight: number | null
  chest: number | null
  waist: number | null
  hips: number | null
  bicep: number | null
  thigh: number | null
  shoulders: number | null
  notes: string | null
  trainer: Trainer | null
}

type Props = {
  memberId: string
  entries: Entry[]
  trainers: Trainer[]
}

const MEASUREMENTS = [
  { key: "weight", label: "Weight", unit: "kg" },
  { key: "chest", label: "Chest", unit: "cm" },
  { key: "waist", label: "Waist", unit: "cm" },
  { key: "hips", label: "Hips", unit: "cm" },
  { key: "bicep", label: "Bicep", unit: "cm" },
  { key: "thigh", label: "Thigh", unit: "cm" },
  { key: "shoulders", label: "Shoulders", unit: "cm" },
] as const

type MeasurementKey = typeof MEASUREMENTS[number]["key"]

type FormState = {
  date: string
  trainerId: string
  notes: string
} & Record<MeasurementKey, string>

const emptyForm = (): FormState => ({
  date: new Date().toISOString().slice(0, 10),
  trainerId: "",
  notes: "",
  weight: "",
  chest: "",
  waist: "",
  hips: "",
  bicep: "",
  thigh: "",
  shoulders: "",
})

export function ProgressLog({ memberId, entries: initialEntries, trainers }: Props) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function setField(key: keyof FormState, value: string) {
    setForm((s) => ({ ...s, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch(`/api/members/${memberId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        trainerId: form.trainerId || null,
      }),
    })

    if (res.ok) {
      const entry = await res.json()
      setEntries((prev) => [entry, ...prev])
      setForm(emptyForm())
      setShowForm(false)
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to save")
    }
    setSaving(false)
  }

  return (
    <div>
      {/* Add entry form */}
      {showForm ? (
        <form onSubmit={handleSubmit} className="border-b border-border bg-muted/20 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setField("date", e.target.value)}
                className="w-full rounded border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Trainer</label>
              <select
                value={form.trainerId}
                onChange={(e) => setField("trainerId", e.target.value)}
                className="w-full rounded border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">— None —</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.firstName} {t.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {MEASUREMENTS.map(({ key, label, unit }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {label} ({unit})
                </label>
                <input
                  type="number" min="0" step="0.1"
                  value={form[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  placeholder="—"
                  className="w-full rounded border border-border bg-white px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Trainer Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              rows={2}
              placeholder="Observations, next targets, feedback…"
              className="w-full rounded border border-border bg-white px-3 py-2 text-sm resize-none focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Entry"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(emptyForm()) }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="px-6 py-4 border-b border-border">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-md border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add check-in
          </button>
        </div>
      )}

      {/* Entries list */}
      {entries.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-muted-foreground">
          No check-ins yet. Add the first one above.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {entries.map((entry) => {
            const isExpanded = expandedId === entry.id
            const hasData = MEASUREMENTS.some((m) => entry[m.key] !== null)
            return (
              <div key={entry.id}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  className="flex w-full items-center gap-4 px-6 py-4 text-left hover:bg-muted/20 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {new Date(entry.date).toLocaleDateString("en-PK", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {entry.trainer
                        ? `Trainer: ${entry.trainer.firstName} ${entry.trainer.lastName}`
                        : "No trainer assigned"}
                      {entry.weight && ` · ${entry.weight} kg`}
                      {entry.waist && ` · Waist: ${entry.waist} cm`}
                    </p>
                  </div>
                  {hasData && (isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />)}
                </button>

                {isExpanded && (
                  <div className="border-t border-border bg-muted/10 px-6 py-4 space-y-3">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 sm:grid-cols-4">
                      {MEASUREMENTS.map(({ key, label, unit }) => {
                        const val = entry[key]
                        if (val === null) return null
                        return (
                          <div key={key} className="flex items-center justify-between py-1">
                            <span className="text-xs text-muted-foreground">{label}</span>
                            <span className="text-sm font-mono font-medium text-foreground">
                              {val} {unit}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    {entry.notes && (
                      <div className="rounded-md bg-white border border-border px-4 py-3">
                        <p className="text-xs text-muted-foreground mb-1">Notes</p>
                        <p className="text-sm text-foreground">{entry.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
