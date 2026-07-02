"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

const PRESET_DURATIONS = [
  { label: "1 Month", days: 30 },
  { label: "3 Months", days: 90 },
  { label: "6 Months", days: 180 },
  { label: "1 Year", days: 365 },
]

type Facility = {
  id: string
  type: string
  label: string
  icon: string
  category: string
  isEnabled: boolean
  monthlyFee: number
}

export default function NewPlanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [days, setDays] = useState(30)
  const [priceMode, setPriceMode] = useState<"MANUAL" | "FACILITY_BASED">("MANUAL")
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>([])
  const [facilitiesLoading, setFacilitiesLoading] = useState(false)

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const fd = new FormData(e.currentTarget)
    const body: Record<string, unknown> = {
      name: fd.get("name"),
      description: fd.get("description") || null,
      durationDays: days,
      priceMode,
    }

    if (priceMode === "FACILITY_BASED") {
      if (selectedFacilityIds.length === 0) {
        setError("Select at least one facility")
        setLoading(false)
        return
      }
      body.facilityIds = selectedFacilityIds
    } else {
      body.price = fd.get("price")
    }

    const res = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      router.push("/dashboard/plans")
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard/plans">
          <button className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">New Membership Plan</h1>
          <p className="text-sm text-muted-foreground">Create a plan your members can subscribe to</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-white shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-medium text-foreground">Plan Details</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-sm font-medium text-foreground">
              Plan Name <span className="text-destructive">*</span>
            </label>
            <input
              id="name" name="name" placeholder="Monthly Premium" required
              className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              id="description" name="description" rows={2}
              placeholder="Full gym access + classes"
              className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Pricing mode */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Pricing Mode</label>
            <div className="flex rounded-md border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setPriceMode("MANUAL")}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  priceMode === "MANUAL"
                    ? "bg-primary text-white"
                    : "bg-white text-muted-foreground hover:bg-muted/40"
                }`}
              >
                Manual Price
              </button>
              <button
                type="button"
                onClick={() => setPriceMode("FACILITY_BASED")}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors border-l border-border ${
                  priceMode === "FACILITY_BASED"
                    ? "bg-primary text-white"
                    : "bg-white text-muted-foreground hover:bg-muted/40"
                }`}
              >
                Facility-Based
              </button>
            </div>
          </div>

          {priceMode === "MANUAL" ? (
            <div className="space-y-1.5">
              <label htmlFor="price" className="block text-sm font-medium text-foreground">
                Price (PKR) <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                  PKR
                </span>
                <input
                  id="price" name="price" type="number" min="0" step="1"
                  placeholder="3500" required
                  className="block w-full rounded-md border border-border bg-white py-2 pl-12 pr-3 font-mono text-sm placeholder:font-sans placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground">
                  Select Facilities <span className="text-destructive">*</span>
                </label>
                <Link
                  href="/dashboard/settings/facilities"
                  target="_blank"
                  className="text-xs text-primary hover:underline"
                >
                  Manage fees ↗
                </Link>
              </div>

              {facilitiesLoading ? (
                <div className="flex items-center gap-2 py-4">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-sm text-muted-foreground">Loading…</span>
                </div>
              ) : facilities.length === 0 ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-sm text-amber-800">
                    No enabled facilities found.{" "}
                    <Link href="/dashboard/settings/facilities" className="underline">
                      Enable some in Settings.
                    </Link>
                  </p>
                </div>
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
                    {selectedFacilityIds.length} facilit{selectedFacilityIds.length === 1 ? "y" : "ies"} × {days} days
                  </p>
                  <p className="font-mono text-base font-semibold text-primary">
                    PKR {Math.round(autoPrice).toLocaleString("en-PK")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Duration */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Duration <span className="text-destructive">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_DURATIONS.map((p) => (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => setDays(p.days)}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    days === p.days
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-white text-foreground hover:bg-muted/50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number" min="1" value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                className="w-20 rounded-md border border-border bg-white px-3 py-1.5 font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create Plan"}
            </Button>
            <Link href="/dashboard/plans">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
