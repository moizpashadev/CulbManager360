"use client"

import { useEffect, useState, useCallback } from "react"

type Facility = {
  type: string
  label: string
  icon: string
  category: string
  isEnabled: boolean
  monthlyFee: number
  notes: string | null
  id: string | null
}

type GroupedFacilities = Record<string, Facility[]>

const CATEGORY_ORDER = ["Aquatics", "Wellness", "Studios", "Gym Floor", "Sports", "Health", "Amenities"]

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [expandedType, setExpandedType] = useState<string | null>(null)
  const [editState, setEditState] = useState<{ fee: string; notes: string }>({ fee: "", notes: "" })

  const load = useCallback(async () => {
    const res = await fetch("/api/facilities")
    if (res.ok) setFacilities(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function toggle(facility: Facility) {
    setSaving(facility.type)
    const res = await fetch("/api/facilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        facilityType: facility.type,
        isEnabled: !facility.isEnabled,
        monthlyFee: facility.monthlyFee,
        notes: facility.notes,
      }),
    })
    if (res.ok) {
      setFacilities((prev) =>
        prev.map((f) => (f.type === facility.type ? { ...f, isEnabled: !f.isEnabled } : f))
      )
    }
    setSaving(null)
  }

  function openExpand(facility: Facility) {
    if (expandedType === facility.type) {
      setExpandedType(null)
    } else {
      setExpandedType(facility.type)
      setEditState({ fee: facility.monthlyFee > 0 ? String(facility.monthlyFee) : "", notes: facility.notes ?? "" })
    }
  }

  async function saveExpanded(type: string) {
    setSaving(type)
    const facility = facilities.find((f) => f.type === type)!
    const fee = parseFloat(editState.fee) || 0
    await fetch("/api/facilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        facilityType: type,
        isEnabled: facility.isEnabled,
        monthlyFee: fee,
        notes: editState.notes || null,
      }),
    })
    setFacilities((prev) =>
      prev.map((f) => (f.type === type ? { ...f, monthlyFee: fee, notes: editState.notes || null } : f))
    )
    setSaving(null)
    setExpandedType(null)
  }

  const grouped: GroupedFacilities = {}
  for (const f of facilities) {
    if (!grouped[f.category]) grouped[f.category] = []
    grouped[f.category].push(f)
  }

  const enabledCount = facilities.filter((f) => f.isEnabled).length
  const facilitiesWithFee = facilities.filter((f) => f.isEnabled && f.monthlyFee > 0).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Facilities & Pricing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enable facilities and set their monthly fees. Fees are used to auto-calculate plan prices.{" "}
          <span className="font-medium text-foreground">{enabledCount} enabled</span>
          {facilitiesWithFee > 0 && <span> · {facilitiesWithFee} with fees set</span>}
        </p>
      </div>

      {CATEGORY_ORDER.map((category) => {
        const items = grouped[category]
        if (!items?.length) return null
        return (
          <div key={category} className="rounded-lg border border-border bg-white shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold text-foreground">{category}</h2>
            </div>
            <div className="divide-y divide-border">
              {items.map((facility) => (
                <div key={facility.type}>
                  <div className="flex items-center gap-4 px-6 py-4">
                    <span className="text-2xl leading-none">{facility.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{facility.label}</p>
                      {facility.monthlyFee > 0 ? (
                        <p className="mt-0.5 text-xs font-medium text-primary">
                          PKR {facility.monthlyFee.toLocaleString("en-PK")} / month
                        </p>
                      ) : facility.notes ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">{facility.notes}</p>
                      ) : null}
                    </div>

                    <button
                      onClick={() => openExpand(facility)}
                      className="text-xs text-muted-foreground hover:text-foreground shrink-0"
                    >
                      {expandedType === facility.type
                        ? "Done"
                        : facility.monthlyFee > 0 || facility.notes
                        ? "Edit"
                        : "Set fee"}
                    </button>

                    <button
                      onClick={() => toggle(facility)}
                      disabled={saving === facility.type}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50 ${
                        facility.isEnabled ? "bg-primary" : "bg-muted"
                      }`}
                      aria-label={`${facility.isEnabled ? "Disable" : "Enable"} ${facility.label}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                          facility.isEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {expandedType === facility.type && (
                    <div className="border-t border-border bg-muted/20 px-6 py-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1">
                            Monthly Fee (PKR)
                          </label>
                          <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-muted-foreground">
                              PKR
                            </span>
                            <input
                              autoFocus
                              type="number"
                              min="0"
                              step="100"
                              value={editState.fee}
                              onChange={(e) => setEditState((s) => ({ ...s, fee: e.target.value }))}
                              placeholder="0"
                              className="w-full rounded border border-border bg-white py-1.5 pl-10 pr-3 font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1">
                            Notes (optional)
                          </label>
                          <input
                            value={editState.notes}
                            onChange={(e) => setEditState((s) => ({ ...s, notes: e.target.value }))}
                            placeholder={`Notes for ${facility.label}…`}
                            className="w-full rounded border border-border bg-white px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => saveExpanded(facility.type)}
                          disabled={saving === facility.type}
                          className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                        >
                          {saving === facility.type ? "Saving…" : "Save"}
                        </button>
                        <button
                          onClick={() => setExpandedType(null)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
