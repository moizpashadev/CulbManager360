"use client"

import { useState } from "react"

type Plan = { id: string; name: string; type: string; oneTimePrice: unknown; monthlyPrice: unknown }

type Props = {
  tenantId: string
  plans: Plan[]
  current: {
    platformPlanId: string | null
    subscriptionStatus: string
    subscriptionStart: string | null
    nextBillingDate: string | null
    subscriptionNotes: string | null
  }
}

const STATUS_OPTIONS = [
  { value: "TRIAL", label: "Trial" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAST_DUE", label: "Past Due" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "CANCELLED", label: "Cancelled" },
]

const STATUS_COLORS: Record<string, string> = {
  TRIAL: "bg-blue-50 text-blue-700 border-blue-200",
  ACTIVE: "bg-green-50 text-green-700 border-green-200",
  PAST_DUE: "bg-amber-50 text-amber-700 border-amber-200",
  SUSPENDED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-gray-50 text-gray-600 border-gray-200",
}

const TYPE_LABELS: Record<string, string> = {
  OFFLINE: "Offline",
  SELF_HOSTED: "Self-Hosted",
  SAAS: "SaaS",
}

export function SubscriptionForm({ tenantId, plans, current }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    platformPlanId: current.platformPlanId ?? "",
    subscriptionStatus: current.subscriptionStatus,
    subscriptionStart: current.subscriptionStart
      ? new Date(current.subscriptionStart).toISOString().slice(0, 10)
      : "",
    nextBillingDate: current.nextBillingDate
      ? new Date(current.nextBillingDate).toISOString().slice(0, 10)
      : "",
    subscriptionNotes: current.subscriptionNotes ?? "",
  })

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function save() {
    setLoading(true)
    const res = await fetch(`/api/admin/tenants/${tenantId}/subscription`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platformPlanId: form.platformPlanId || null,
        subscriptionStatus: form.subscriptionStatus,
        subscriptionStart: form.subscriptionStart || null,
        nextBillingDate: form.nextBillingDate || null,
        subscriptionNotes: form.subscriptionNotes || null,
      }),
    })
    setLoading(false)
    if (res.ok) {
      setOpen(false)
      window.location.reload()
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? "Failed to update subscription")
    }
  }

  const currentPlan = plans.find((p) => p.id === current.platformPlanId)

  return (
    <div className="rounded-lg border border-border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-sm font-semibold text-foreground">Subscription</h2>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40"
        >
          {open ? "Cancel" : "Edit"}
        </button>
      </div>

      {!open ? (
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between px-6 py-3">
            <span className="text-xs text-muted-foreground">Plan</span>
            <span className="text-sm font-medium text-foreground">
              {currentPlan
                ? `${currentPlan.name} (${TYPE_LABELS[currentPlan.type] ?? currentPlan.type})`
                : <span className="text-muted-foreground italic">None assigned</span>}
            </span>
          </div>
          <div className="flex items-center justify-between px-6 py-3">
            <span className="text-xs text-muted-foreground">Status</span>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[current.subscriptionStatus] ?? ""}`}>
              {current.subscriptionStatus}
            </span>
          </div>
          {current.subscriptionStart && (
            <div className="flex items-center justify-between px-6 py-3">
              <span className="text-xs text-muted-foreground">Started</span>
              <span className="text-sm text-foreground">
                {new Date(current.subscriptionStart).toLocaleDateString("en-PK")}
              </span>
            </div>
          )}
          {current.nextBillingDate && (
            <div className="flex items-center justify-between px-6 py-3">
              <span className="text-xs text-muted-foreground">Next Billing</span>
              <span className="text-sm font-medium text-foreground">
                {new Date(current.nextBillingDate).toLocaleDateString("en-PK")}
              </span>
            </div>
          )}
          {current.subscriptionNotes && (
            <div className="px-6 py-3">
              <span className="text-xs text-muted-foreground">Notes</span>
              <p className="mt-1 text-sm text-foreground">{current.subscriptionNotes}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">Plan</label>
            <select
              value={form.platformPlanId}
              onChange={(e) => set("platformPlanId", e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">— No plan —</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({TYPE_LABELS[p.type] ?? p.type})
                  {p.oneTimePrice ? ` · PKR ${Number(p.oneTimePrice).toLocaleString("en-PK")} one-time` : ""}
                  {p.monthlyPrice ? ` · PKR ${Number(p.monthlyPrice).toLocaleString("en-PK")}/mo` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <label key={s.value} className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="radio"
                    name="status"
                    value={s.value}
                    checked={form.subscriptionStatus === s.value}
                    onChange={() => set("subscriptionStatus", s.value)}
                    className="h-3.5 w-3.5"
                  />
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.value]}`}>
                    {s.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">Start Date</label>
              <input
                type="date"
                value={form.subscriptionStart}
                onChange={(e) => set("subscriptionStart", e.target.value)}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">Next Billing Date</label>
              <input
                type="date"
                value={form.nextBillingDate}
                onChange={(e) => set("nextBillingDate", e.target.value)}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">Notes</label>
            <textarea
              value={form.subscriptionNotes}
              onChange={(e) => set("subscriptionNotes", e.target.value)}
              rows={2}
              placeholder="Payment notes, special terms..."
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm resize-none focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="rounded-md border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/40">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={loading}
              className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
