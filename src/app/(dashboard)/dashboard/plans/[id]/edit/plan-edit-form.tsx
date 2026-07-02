"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Check } from "lucide-react"

type Facility = {
  id: string
  type: string
  label: string
  icon: string
  isEnabled: boolean
  monthlyFee: number
}

type Props = {
  planId: string
  defaultValues: {
    name: string
    description: string
    price: string
    durationDays: string
    isActive: boolean
    priceMode: "MANUAL" | "FACILITY_BASED"
    selectedFacilityIds: string[]
  }
}

export function PlanEditForm({ planId, defaultValues }: Props) {
  const router = useRouter()
  const [name, setName] = useState(defaultValues.name)
  const [description, setDescription] = useState(defaultValues.description)
  const [price, setPrice] = useState(defaultValues.price)
  const [durationDays, setDurationDays] = useState(defaultValues.durationDays)
  const [isActive, setIsActive] = useState(defaultValues.isActive)
  const [priceMode, setPriceMode] = useState<"MANUAL" | "FACILITY_BASED">(defaultValues.priceMode)
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>(defaultValues.selectedFacilityIds)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [facilitiesLoading, setFacilitiesLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (priceMode === "FACILITY_BASED" && facilities.length === 0) {
      setFacilitiesLoading(true)
      fetch("/api/facilities")
        .then((r) => r.json())
        .then((data: Facility[]) => {
          setFacilities(data.filter((f) => f.isEnabled && f.id && f.monthlyFee > 0))
          setFacilitiesLoading(false)
        })
    }
  }, [priceMode, facilities.length])

  const days = parseInt(durationDays) || 30
  const monthsRatio = days / 30
  const autoPrice = selectedFacilityIds.reduce((sum, id) => {
    const f = facilities.find((x) => x.id === id)
    return sum + (f ? f.monthlyFee * monthsRatio : 0)
  }, 0)

  function toggleFacility(id: string) {
    setSelectedFacilityIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError("Name is required."); return }

    setSaving(true)
    setError(null)

    const body: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim() || null,
      durationDays: parseInt(durationDays),
      isActive,
      priceMode,
    }

    if (priceMode === "FACILITY_BASED") {
      body.facilityIds = selectedFacilityIds
    } else {
      const priceNum = parseFloat(price)
      if (isNaN(priceNum) || priceNum <= 0) { setError("Enter a valid price."); setSaving(false); return }
      body.price = priceNum
    }

    const res = await fetch(`/api/plans/${planId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      router.push("/dashboard/plans")
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to save.")
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Plan Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
        <label className="mb-1 block text-sm font-medium text-foreground">Pricing Mode</label>
        <div className="flex rounded-md border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setPriceMode("MANUAL")}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              priceMode === "MANUAL" ? "bg-primary text-white" : "bg-white text-muted-foreground hover:bg-muted/40"
            }`}
          >
            Manual Price
          </button>
          <button
            type="button"
            onClick={() => setPriceMode("FACILITY_BASED")}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors border-l border-border ${
              priceMode === "FACILITY_BASED" ? "bg-primary text-white" : "bg-white text-muted-foreground hover:bg-muted/40"
            }`}
          >
            Facility-Based
          </button>
        </div>
      </div>

      {priceMode === "MANUAL" ? (
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Price (PKR) *</label>
          <input
            type="number" min="0" step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-foreground">Select Facilities *</label>
            <Link href="/dashboard/settings/facilities" target="_blank" className="text-xs text-primary hover:underline">
              Manage fees ↗
            </Link>
          </div>

          {facilitiesLoading ? (
            <div className="flex items-center gap-2 py-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm text-muted-foreground">Loading…</span>
            </div>
          ) : facilities.length === 0 ? (
            <p className="text-sm text-amber-700">
              No enabled facilities.{" "}
              <Link href="/dashboard/settings/facilities" className="underline">Enable some.</Link>
            </p>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              {facilities.map((f) => {
                const selected = selectedFacilityIds.includes(f.id)
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFacility(f.id)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-border last:border-0 ${
                      selected ? "bg-primary/5" : "hover:bg-muted/30"
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                        selected ? "border-primary bg-primary" : "border-border bg-white"
                      }`}
                    >
                      {selected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-lg leading-none">{f.icon}</span>
                    <p className="flex-1 text-sm font-medium text-foreground">{f.label}</p>
                    <p className="font-mono text-sm text-muted-foreground">
                      PKR {f.monthlyFee.toLocaleString("en-PK")}/mo
                    </p>
                  </button>
                )
              })}
            </div>
          )}

          {selectedFacilityIds.length > 0 && (
            <div className="rounded-md bg-muted/50 px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedFacilityIds.length} facilit{selectedFacilityIds.length === 1 ? "y" : "ies"} × {durationDays} days
              </p>
              <p className="font-mono text-base font-semibold text-primary">
                PKR {Math.round(autoPrice).toLocaleString("en-PK")}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Duration (days) *</label>
          <input
            type="number" min="1"
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-end">
          <label className="flex cursor-pointer items-center gap-2 pb-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary"
            />
            <span className="text-sm text-foreground">Active</span>
          </label>
        </div>
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
        <Link href="/dashboard/plans">
          <button type="button" className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40">
            Cancel
          </button>
        </Link>
      </div>
    </form>
  )
}
