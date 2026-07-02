"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type PlanFormData = {
  name: string
  type: "OFFLINE" | "SELF_HOSTED" | "SAAS"
  description: string
  oneTimePrice: string
  monthlyPrice: string
  features: string
  isActive: boolean
  sortOrder: string
}

type Props = {
  planId?: string
  defaultValues?: Partial<PlanFormData>
}

const TYPE_OPTIONS = [
  { value: "OFFLINE", label: "Offline / Local", desc: "Runs on client's own computer, no internet required" },
  { value: "SELF_HOSTED", label: "Self-Hosted Online", desc: "Hosted on client's own server / domain" },
  { value: "SAAS", label: "Cloud SaaS", desc: "Hosted on your servers, client just logs in" },
] as const

export function PlanForm({ planId, defaultValues }: Props) {
  const router = useRouter()
  const isEdit = !!planId

  const [form, setForm] = useState<PlanFormData>({
    name: defaultValues?.name ?? "",
    type: defaultValues?.type ?? "SAAS",
    description: defaultValues?.description ?? "",
    oneTimePrice: defaultValues?.oneTimePrice ?? "",
    monthlyPrice: defaultValues?.monthlyPrice ?? "",
    features: defaultValues?.features ?? "",
    isActive: defaultValues?.isActive ?? true,
    sortOrder: defaultValues?.sortOrder ?? "0",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function set(k: keyof PlanFormData, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError("Plan name is required"); return }
    if (!form.oneTimePrice && !form.monthlyPrice) {
      setError("At least one price (one-time or monthly) is required")
      return
    }
    setError("")
    setLoading(true)

    const payload = {
      name: form.name.trim(),
      type: form.type,
      description: form.description.trim() || null,
      oneTimePrice: form.oneTimePrice ? parseFloat(form.oneTimePrice) : null,
      monthlyPrice: form.monthlyPrice ? parseFloat(form.monthlyPrice) : null,
      features: form.features.trim() || null,
      isActive: form.isActive,
      sortOrder: parseInt(form.sortOrder) || 0,
    }

    const res = await fetch(isEdit ? `/api/admin/plans/${planId}` : "/api/admin/plans", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    setLoading(false)
    if (res.ok) {
      router.push("/admin/plans")
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Something went wrong")
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Plan type */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-foreground">Plan Type</label>
        <div className="grid grid-cols-3 gap-3">
          {TYPE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer flex-col gap-1 rounded-lg border-2 p-4 transition-colors ${
                form.type === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-border bg-white hover:border-primary/40"
              }`}
            >
              <input
                type="radio"
                name="type"
                value={opt.value}
                checked={form.type === opt.value}
                onChange={() => set("type", opt.value)}
                className="sr-only"
              />
              <span className="text-sm font-semibold text-foreground">{opt.label}</span>
              <span className="text-xs text-muted-foreground">{opt.desc}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Plan Name <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Starter, Professional, Enterprise"
          required
          className="w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          placeholder="Brief description of this plan..."
          className="w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            One-Time Price (PKR)
            <span className="ml-1 text-xs text-muted-foreground">(for Offline / Self-Hosted)</span>
          </label>
          <input
            type="number"
            value={form.oneTimePrice}
            onChange={(e) => set("oneTimePrice", e.target.value)}
            min={0}
            step={500}
            placeholder="e.g. 15000"
            className="w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Monthly Price (PKR)
            <span className="ml-1 text-xs text-muted-foreground">(for SaaS / recurring)</span>
          </label>
          <input
            type="number"
            value={form.monthlyPrice}
            onChange={(e) => set("monthlyPrice", e.target.value)}
            min={0}
            step={100}
            placeholder="e.g. 4000"
            className="w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Features */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Features
          <span className="ml-1 text-xs text-muted-foreground">(one per line, shown on pitch page)</span>
        </label>
        <textarea
          value={form.features}
          onChange={(e) => set("features", e.target.value)}
          rows={6}
          placeholder={"Unlimited members\nMulti-branch support\nKuickpay BPS integration\nWhatsApp receipt sharing\nCSV data export"}
          className="w-full rounded-md border border-border bg-white px-3 py-2.5 font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      {/* Sort order + Active */}
      <div className="flex items-center gap-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Display Order</label>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => set("sortOrder", e.target.value)}
            min={0}
            className="w-24 rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer pt-5">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary"
          />
          <span className="text-sm text-foreground">Active (visible to clients)</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-border pt-5">
        <button
          type="button"
          onClick={() => router.push("/admin/plans")}
          className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/40"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? "Saving…" : isEdit ? "Save Changes" : "Create Plan"}
        </button>
      </div>
    </form>
  )
}
