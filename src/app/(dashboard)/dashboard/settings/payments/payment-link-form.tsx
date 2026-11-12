"use client"

import { useState } from "react"

type Props = {
  hasInstitutionId: boolean
  currentEnabled: boolean
  currentTemplate: string
}

const DEFAULT_TEMPLATE = "https://payments.kuickpay.com/inquiry?cn={cn}"

export function PaymentLinkForm({ hasInstitutionId, currentEnabled, currentTemplate }: Props) {
  const [enabled, setEnabled] = useState(currentEnabled)
  const [template, setTemplate] = useState(currentTemplate || DEFAULT_TEMPLATE)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setError(null)
    if (enabled && !template.includes("{cn}")) {
      setError('Template must contain "{cn}" — that\'s where each member\'s consumer number gets inserted')
      return
    }
    setSaving(true)
    setSaved(false)
    const res = await fetch("/api/settings/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentLinkEnabled: enabled, paymentLinkTemplate: template }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Failed to save")
    }
  }

  if (!hasInstitutionId) {
    return (
      <p className="text-sm text-muted-foreground">
        Set your Kuickpay Institution ID above first — Payment Link needs it to build each member&apos;s consumer number.
      </p>
    )
  }

  return (
    <div className="space-y-4 max-w-md">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => { setEnabled(e.target.checked); setSaved(false) }}
          className="h-4 w-4 rounded border-border text-primary"
        />
        <span className="text-sm font-medium text-foreground">Enable Payment Link</span>
      </label>

      {enabled && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Link Template</label>
          <input
            type="text"
            value={template}
            onChange={(e) => { setTemplate(e.target.value); setSaved(false) }}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {"{cn}"} is replaced with each member&apos;s own consumer number when a link is sent.
          </p>
        </div>
      )}

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
