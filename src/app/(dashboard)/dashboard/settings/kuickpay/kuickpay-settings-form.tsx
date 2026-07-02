"use client"

import { useState } from "react"

type Props = { tenantId: string; currentInstitutionId: string }

export function KuickpaySettingsForm({ currentInstitutionId }: Props) {
  const [institutionId, setInstitutionId] = useState(currentInstitutionId)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError(null)
    const res = await fetch("/api/settings/kuickpay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kuickpayInstitutionId: institutionId }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to save")
    }
  }

  return (
    <div className="space-y-4 max-w-sm">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Institution ID
        </label>
        <input
          type="text"
          value={institutionId}
          onChange={(e) => { setInstitutionId(e.target.value); setSaved(false) }}
          placeholder="e.g. 02429"
          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Provided by Kuickpay after onboarding. Leave blank for testing.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-sm text-primary">Saved!</span>}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </div>
  )
}
