"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dumbbell, Grid3x3 } from "lucide-react"

type DefaultValues = {
  name: string
  contactEmail: string | null
  phone: string | null
  address: string | null
  moduleGym: boolean
  moduleCourts: boolean
}

type Props = { defaultValues: DefaultValues }

export function GeneralSettingsForm({ defaultValues }: Props) {
  const router = useRouter()
  const [name, setName] = useState(defaultValues.name)
  const [contactEmail, setContactEmail] = useState(defaultValues.contactEmail ?? "")
  const [phone, setPhone] = useState(defaultValues.phone ?? "")
  const [address, setAddress] = useState(defaultValues.address ?? "")
  const [moduleGym, setModuleGym] = useState(defaultValues.moduleGym)
  const [moduleCourts, setModuleCourts] = useState(defaultValues.moduleCourts)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!moduleGym && !moduleCourts) {
      setError("At least one module must be enabled.")
      return
    }
    setSaving(true)
    setError("")
    setSaved(false)

    const res = await fetch("/api/settings/general", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, contactEmail, phone, address, moduleGym, moduleCourts }),
    })

    setSaving(false)
    if (res.ok) {
      setSaved(true)
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to save")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Club profile */}
      <div className="rounded-lg border border-border bg-white shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Club Profile</h2>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Club / Gym Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@gymname.com"
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0300-0000000"
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="Street, City"
              className="w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Module selection */}
      <div className="rounded-lg border border-border bg-white shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Active Modules</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Choose what your club offers — this controls which menu items are visible to your team.
          </p>
        </div>
        <div className="space-y-3 px-6 py-5">

          <button
            type="button"
            onClick={() => setModuleGym((v) => !v)}
            className={`flex w-full items-start gap-4 rounded-lg border-2 p-4 text-left transition-colors ${
              moduleGym ? "border-primary bg-primary/5" : "border-border bg-white hover:bg-muted/30"
            }`}
          >
            <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${moduleGym ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
              <Dumbbell className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Gym Management</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${moduleGym ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {moduleGym ? "Enabled" : "Disabled"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Members, Plans, Billing, Attendance, Trainers, Health tracking, Classes
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setModuleCourts((v) => !v)}
            className={`flex w-full items-start gap-4 rounded-lg border-2 p-4 text-left transition-colors ${
              moduleCourts ? "border-primary bg-primary/5" : "border-border bg-white hover:bg-muted/30"
            }`}
          >
            <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${moduleCourts ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
              <Grid3x3 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Court Bookings</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${moduleCourts ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {moduleCourts ? "Enabled" : "Disabled"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Padel, Cricket, Badminton, Squash — hourly slot bookings with conflict detection
              </p>
            </div>
          </button>

          {!moduleGym && !moduleCourts && (
            <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
              At least one module must be enabled.
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || (!moduleGym && !moduleCourts)}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
        {saved && (
          <p className="text-sm text-green-600">
            Saved. Changes apply on next login.
          </p>
        )}
      </div>
    </form>
  )
}
