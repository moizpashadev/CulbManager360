"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Clock, DollarSign, Grid3x3, Pencil, X } from "lucide-react"

type Court = {
  id: string
  name: string
  description: string | null
  sport: string | null
  pricePerSlot: number
  slotDuration: number
  openTime: string
  closeTime: string
  openTimeFormatted: string
  closeTimeFormatted: string
  isActive: boolean
  bookingCount: number
}

type Props = {
  courts: Court[]
  canManage: boolean
}

const DURATION_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "60 min" },
  { value: 90, label: "90 min" },
  { value: 120, label: "2 hrs" },
]

const SPORT_SUGGESTIONS = ["Padel", "Cricket", "Badminton", "Squash", "Tennis", "Basketball", "Football"]

const EMPTY_FORM = {
  name: "",
  sport: "",
  description: "",
  pricePerSlot: "",
  slotDuration: 60,
  openTime: "06:00",
  closeTime: "22:00",
}

export function CourtsClient({ courts: initialCourts, canManage }: Props) {
  const router = useRouter()
  const [courts, setCourts] = useState(initialCourts)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError("")
    setShowForm(true)
  }

  function openEdit(court: Court) {
    setEditingId(court.id)
    setForm({
      name: court.name,
      sport: court.sport || "",
      description: court.description || "",
      pricePerSlot: String(court.pricePerSlot),
      slotDuration: court.slotDuration,
      openTime: court.openTime,
      closeTime: court.closeTime,
    })
    setError("")
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setError("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const payload = {
        name: form.name.trim(),
        sport: form.sport.trim() || null,
        description: form.description.trim() || null,
        pricePerSlot: parseFloat(form.pricePerSlot) || 0,
        slotDuration: form.slotDuration,
        openTime: form.openTime,
        closeTime: form.closeTime,
      }

      let res: Response
      if (editingId) {
        res = await fetch(`/api/courts/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch("/api/courts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Something went wrong")
        return
      }

      closeForm()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleDeactivate(id: string) {
    await fetch(`/api/courts/${id}`, { method: "DELETE" })
    setCourts((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: false } : c)))
  }

  async function handleActivate(id: string) {
    await fetch(`/api/courts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: true }),
    })
    setCourts((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: true } : c)))
  }

  return (
    <>
      {/* Add button */}
      {canManage && (
        <div className="mb-6">
          <button onClick={openAdd} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Court
          </button>
        </div>
      )}

      {/* Courts grid */}
      {courts.length === 0 ? (
        <div className="rounded-lg border border-border bg-white p-16 text-center shadow-sm">
          <Grid3x3 className="mx-auto mb-4 h-10 w-10 text-muted-foreground/40" />
          <p className="text-base font-medium text-foreground">No courts yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add courts to start accepting slot bookings for sports like Padel, Cricket, Badminton, and more.
          </p>
          {canManage && (
            <button
              onClick={openAdd}
              className="mt-4 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40"
            >
              Add your first court
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courts.map((court) => (
            <div
              key={court.id}
              className={`rounded-lg border bg-white shadow-sm ${court.isActive ? "border-border" : "border-border opacity-60"}`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground truncate">{court.name}</h3>
                      {court.sport && (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-primary">
                          {court.sport}
                        </span>
                      )}
                      {!court.isActive && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          Inactive
                        </span>
                      )}
                    </div>
                    {court.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{court.description}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      PKR {court.pricePerSlot.toLocaleString("en-PK")} / {court.slotDuration} min slot
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>{court.openTimeFormatted} – {court.closeTimeFormatted}</span>
                  </div>
                  {court.bookingCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {court.bookingCount} booking{court.bookingCount !== 1 ? "s" : ""} total
                    </p>
                  )}
                </div>
              </div>

              {canManage && (
                <div className="border-t border-border px-5 py-3 flex items-center gap-2">
                  <button
                    onClick={() => openEdit(court)}
                    className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40 border border-border"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                  {court.isActive ? (
                    <button
                      onClick={() => handleDeactivate(court.id)}
                      className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 border border-border"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivate(court.id)}
                      className="rounded-md px-3 py-1.5 text-xs font-medium text-primary hover:bg-secondary border border-border"
                    >
                      Activate
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl border border-border bg-white shadow-xl mx-4">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">
                {editingId ? "Edit Court" : "Add Court"}
              </h2>
              <button onClick={closeForm} className="rounded-md p-1 text-muted-foreground hover:bg-muted/40">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Court Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Court A, Padel Court 1"
                  required
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Sport</label>
                <input
                  type="text"
                  value={form.sport}
                  onChange={(e) => setForm((f) => ({ ...f, sport: e.target.value }))}
                  placeholder="e.g. Padel, Cricket, Badminton"
                  list="sport-suggestions"
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <datalist id="sport-suggestions">
                  {SPORT_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional notes about this court"
                  rows={2}
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Price / Slot (PKR)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.pricePerSlot}
                    onChange={(e) => setForm((f) => ({ ...f, pricePerSlot: e.target.value }))}
                    placeholder="0"
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Slot Duration</label>
                  <select
                    value={form.slotDuration}
                    onChange={(e) => setForm((f) => ({ ...f, slotDuration: parseInt(e.target.value) }))}
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {DURATION_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Open Time</label>
                  <input
                    type="time"
                    value={form.openTime}
                    onChange={(e) => setForm((f) => ({ ...f, openTime: e.target.value }))}
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Close Time</label>
                  <input
                    type="time"
                    value={form.closeTime}
                    onChange={(e) => setForm((f) => ({ ...f, closeTime: e.target.value }))}
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? "Saving…" : editingId ? "Save Changes" : "Add Court"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
