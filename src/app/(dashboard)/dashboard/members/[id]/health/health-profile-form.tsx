"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const GOALS = [
  { value: "GENERAL_FITNESS", label: "General Fitness" },
  { value: "WEIGHT_LOSS", label: "Weight Loss" },
  { value: "MUSCLE_GAIN", label: "Muscle Gain" },
  { value: "ENDURANCE", label: "Endurance" },
  { value: "FLEXIBILITY", label: "Flexibility" },
  { value: "REHABILITATION", label: "Rehabilitation" },
]

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

type DefaultValues = {
  height: string
  initialWeight: string
  bloodGroup: string
  medicalConditions: string
  allergies: string
  goal: string
  targetWeight: string
  notes: string
} | null

type Props = {
  memberId: string
  defaultValues: DefaultValues
}

export function HealthProfileForm({ memberId, defaultValues }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    height: defaultValues?.height ?? "",
    initialWeight: defaultValues?.initialWeight ?? "",
    bloodGroup: defaultValues?.bloodGroup ?? "",
    medicalConditions: defaultValues?.medicalConditions ?? "",
    allergies: defaultValues?.allergies ?? "",
    goal: defaultValues?.goal ?? "GENERAL_FITNESS",
    targetWeight: defaultValues?.targetWeight ?? "",
    notes: defaultValues?.notes ?? "",
  })

  function set(key: keyof typeof form, value: string) {
    setForm((s) => ({ ...s, [key]: value }))
    setSaved(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch(`/api/members/${memberId}/health`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      setSaved(true)
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to save")
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Height (cm)</label>
          <input
            type="number" min="0" step="0.1"
            value={form.height}
            onChange={(e) => set("height", e.target.value)}
            placeholder="172"
            className="w-full rounded border border-border bg-white px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Starting Weight (kg)</label>
          <input
            type="number" min="0" step="0.1"
            value={form.initialWeight}
            onChange={(e) => set("initialWeight", e.target.value)}
            placeholder="75"
            className="w-full rounded border border-border bg-white px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Target Weight (kg)</label>
          <input
            type="number" min="0" step="0.1"
            value={form.targetWeight}
            onChange={(e) => set("targetWeight", e.target.value)}
            placeholder="65"
            className="w-full rounded border border-border bg-white px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Blood Group</label>
          <select
            value={form.bloodGroup}
            onChange={(e) => set("bloodGroup", e.target.value)}
            className="w-full rounded border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">—</option>
            {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Goal</label>
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => set("goal", g.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                form.goal === g.value
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-white text-muted-foreground hover:bg-muted/40"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Medical Conditions</label>
          <textarea
            value={form.medicalConditions}
            onChange={(e) => set("medicalConditions", e.target.value)}
            rows={2}
            placeholder="e.g. High blood pressure, diabetes, heart condition…"
            className="w-full rounded border border-border bg-white px-3 py-2 text-sm resize-none focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Allergies</label>
          <textarea
            value={form.allergies}
            onChange={(e) => set("allergies", e.target.value)}
            rows={2}
            placeholder="e.g. Pollen, nuts, latex…"
            className="w-full rounded border border-border bg-white px-3 py-2 text-sm resize-none focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={2}
          placeholder="Any other relevant health notes…"
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
          {saving ? "Saving…" : "Save Health Profile"}
        </button>
        {saved && <p className="text-sm text-green-600">Saved</p>}
      </div>
    </form>
  )
}
