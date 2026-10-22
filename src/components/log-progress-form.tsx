"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Gym = { tenantId: string; gymName: string }

const FIELDS = [
  { key: "weight", label: "Weight (kg)" },
  { key: "chest", label: "Chest (in)" },
  { key: "waist", label: "Waist (in)" },
  { key: "hips", label: "Hips (in)" },
  { key: "bicep", label: "Bicep (in)" },
  { key: "thigh", label: "Thigh (in)" },
  { key: "shoulders", label: "Shoulders (in)" },
] as const

export function LogProgressForm({ gyms }: { gyms: Gym[] }) {
  const [tenantId, setTenantId] = useState(gyms[0]?.tenantId ?? "")
  const [values, setValues] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function set(key: string, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await fetch("/api/member/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, ...values, notes }),
    })
    setLoading(false)
    if (res.ok) {
      window.location.reload()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Failed to save")
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {gyms.length > 1 && (
        <div className="space-y-1.5">
          <Label htmlFor="gym">Gym</Label>
          <select
            id="gym"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {gyms.map((g) => (
              <option key={g.tenantId} value={g.tenantId}>{g.gymName}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label htmlFor={f.key} className="text-xs">{f.label}</Label>
            <Input
              id={f.key}
              type="number"
              step="0.1"
              value={values[f.key] ?? ""}
              onChange={(e) => set(f.key, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes" className="text-xs">Notes (optional)</Label>
        <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Log measurements"}
      </Button>
    </form>
  )
}
