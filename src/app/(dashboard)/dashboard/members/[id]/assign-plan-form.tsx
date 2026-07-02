"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

type Plan = { id: string; name: string; price: unknown; durationDays: number; description: string | null }
type Facility = { id: string; label: string; icon: string; monthlyFee: number; isEnabled: boolean }

const PAYMENT_METHODS = [
  { value: "", label: "— Record later" },
  { value: "CASH", label: "Cash" },
  { value: "EASYPAISA", label: "Easypaisa" },
  { value: "JAZZCASH", label: "JazzCash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CARD", label: "Card" },
  { value: "CHEQUE", label: "Cheque" },
]

const DURATIONS = [
  { label: "1 Month", days: 30 },
  { label: "3 Months", days: 90 },
  { label: "6 Months", days: 180 },
  { label: "1 Year", days: 365 },
]

const today = new Date().toISOString().split("T")[0]

type Props = {
  memberId: string
  plans: Plan[]
  defaultTab?: "facility" | "plan"
  redirectAfter?: string
}

export function AssignPlanForm({ memberId, plans, defaultTab = "plan", redirectAfter }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<"facility" | "plan">(defaultTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [startDate, setStartDate] = useState(today)
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [notes, setNotes] = useState("")

  // Facility tab state
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [facilitiesLoading, setFacilitiesLoading] = useState(false)
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>([])
  const [durationDays, setDurationDays] = useState(30)

  // Plan tab state
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id ?? "")

  useEffect(() => {
    if (tab === "facility" && facilities.length === 0) {
      setFacilitiesLoading(true)
      fetch("/api/facilities")
        .then((r) => r.json())
        .then((data: Facility[]) => {
          setFacilities(data.filter((f) => f.isEnabled && f.id && f.monthlyFee > 0))
          setFacilitiesLoading(false)
        })
    }
  }, [tab, facilities.length])

  function toggleFacility(id: string) {
    setSelectedFacilityIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const monthsRatio = durationDays / 30
  const facilityTotal = selectedFacilityIds.reduce((sum, id) => {
    const f = facilities.find((x) => x.id === id)
    return sum + (f ? f.monthlyFee * monthsRatio : 0)
  }, 0)

  const selectedPlan = plans.find((p) => p.id === selectedPlanId)
  const planSubtotal = selectedPlan ? Number(selectedPlan.price) : 0

  const subtotal = tab === "facility" ? Math.round(facilityTotal) : planSubtotal
  const discountAmt = Math.min(discount, subtotal)
  const total = Math.max(0, subtotal - discountAmt)

  const endDate = (() => {
    const days = tab === "facility" ? durationDays : selectedPlan?.durationDays
    if (!days || !startDate) return null
    const d = new Date(startDate)
    d.setDate(d.getDate() + days)
    return d.toLocaleDateString("en-PK", { dateStyle: "medium" })
  })()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const body: Record<string, unknown> = {
      startDate,
      discount: discountAmt,
      notes: notes || null,
      paymentMethod: paymentMethod || null,
    }

    if (tab === "facility") {
      if (selectedFacilityIds.length === 0) {
        setError("Select at least one facility")
        setLoading(false)
        return
      }
      body.facilityIds = selectedFacilityIds
      body.durationDays = durationDays
    } else {
      if (!selectedPlanId) {
        setError("Select a plan")
        setLoading(false)
        return
      }
      body.planId = selectedPlanId
    }

    const res = await fetch(`/api/members/${memberId}/memberships`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      if (redirectAfter) {
        router.push(redirectAfter)
      } else {
        router.refresh()
      }
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to assign membership")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tab switch */}
      <div className="flex rounded-md border border-border overflow-hidden text-sm">
        <button
          type="button"
          onClick={() => setTab("facility")}
          className={`flex-1 px-4 py-2 font-medium transition-colors ${
            tab === "facility" ? "bg-primary text-white" : "bg-white text-muted-foreground hover:bg-muted/40"
          }`}
        >
          Pick Facilities
        </button>
        <button
          type="button"
          onClick={() => setTab("plan")}
          className={`flex-1 px-4 py-2 font-medium transition-colors border-l border-border ${
            tab === "plan" ? "bg-primary text-white" : "bg-white text-muted-foreground hover:bg-muted/40"
          }`}
        >
          Choose a Plan
        </button>
      </div>

      {tab === "facility" ? (
        <div className="space-y-3">
          {facilitiesLoading ? (
            <div className="flex items-center gap-2 py-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm text-muted-foreground">Loading facilities…</span>
            </div>
          ) : facilities.length === 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-800">
                No facilities configured yet. Go to{" "}
                <a href="/dashboard/settings/facilities" className="underline">Settings → Facilities</a>{" "}
                to enable and set fees.
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
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors border-b border-border last:border-0 ${
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
                    <span className="text-xl leading-none">{f.icon}</span>
                    <p className="flex-1 text-sm font-medium text-foreground">{f.label}</p>
                    <p className="font-mono text-sm text-muted-foreground">
                      PKR {f.monthlyFee.toLocaleString("en-PK")}/mo
                    </p>
                  </button>
                )
              })}
            </div>
          )}

          {/* Duration */}
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Duration</p>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.days}
                  type="button"
                  onClick={() => setDurationDays(d.days)}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    durationDays === d.days
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-white text-foreground hover:bg-muted/50"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {selectedFacilityIds.length > 0 && (
            <div className="rounded-md bg-muted/50 px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedFacilityIds.length} facilit{selectedFacilityIds.length === 1 ? "y" : "ies"} × {durationDays} days
              </p>
              <p className="font-mono text-base font-semibold text-primary">
                PKR {Math.round(facilityTotal).toLocaleString("en-PK")}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No plans available.{" "}
              <a href="/dashboard/plans/new" className="text-primary hover:underline">Create one first.</a>
            </p>
          ) : (
            plans.map((p) => (
              <label
                key={p.id}
                className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                  selectedPlanId === p.id ? "border-primary bg-secondary/60" : "border-border hover:bg-muted/40"
                }`}
              >
                <input
                  type="radio" name="planId" value={p.id}
                  checked={selectedPlanId === p.id}
                  onChange={() => setSelectedPlanId(p.id)}
                  className="mt-0.5 accent-primary"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <p className="font-mono text-sm font-semibold text-foreground">
                      PKR {Number(p.price).toLocaleString("en-PK")}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {p.durationDays} days{p.description && ` · ${p.description}`}
                  </p>
                </div>
              </label>
            ))
          )}
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Start Date</label>
          <input
            type="date" required value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Expires</label>
          <div className="flex h-[38px] items-center rounded-md border border-border bg-muted/30 px-3 text-sm text-muted-foreground">
            {endDate ?? "—"}
          </div>
        </div>
      </div>

      {/* Discount */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">Discount (PKR)</label>
        <input
          type="number" min="0" max={subtotal} step="1"
          value={discount || ""}
          onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
          placeholder="0"
          className="block w-full rounded-md border border-border bg-white px-3 py-2 font-mono text-sm placeholder:font-sans placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Invoice preview */}
      {subtotal > 0 && (
        <div className="rounded-md border border-border bg-muted/20 p-3 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-mono">PKR {subtotal.toLocaleString("en-PK")}</span>
          </div>
          {discountAmt > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Discount</span>
              <span className="font-mono text-destructive">- PKR {discountAmt.toLocaleString("en-PK")}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold text-foreground">
            <span>Total</span>
            <span className="font-mono text-primary">PKR {total.toLocaleString("en-PK")}</span>
          </div>
        </div>
      )}

      {/* Payment */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">Payment Received Via</label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">Selecting a method marks the invoice as Paid.</p>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="e.g. Corporate discount, referred by Ali…"
          className="block w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        disabled={loading || (tab === "plan" && !selectedPlan) || (tab === "facility" && selectedFacilityIds.length === 0)}
        className="w-full"
      >
        {loading
          ? "Assigning…"
          : total > 0
          ? `Assign Membership · PKR ${total.toLocaleString("en-PK")}`
          : "Assign Membership"}
      </Button>
    </form>
  )
}
