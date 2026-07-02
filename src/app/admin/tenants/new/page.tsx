"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Dumbbell, Grid3x3 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NewTenantPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [moduleGym, setModuleGym] = useState(true)
  const [moduleCourts, setModuleCourts] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!moduleGym && !moduleCourts) {
      setError("Select at least one module.")
      return
    }
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const res = await fetch("/api/admin/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gymName: formData.get("gymName"),
        slug: formData.get("slug"),
        contactEmail: formData.get("contactEmail") || null,
        phone: formData.get("phone") || null,
        address: formData.get("address") || null,
        ownerFirstName: formData.get("ownerFirstName"),
        ownerLastName: formData.get("ownerLastName"),
        ownerEmail: formData.get("ownerEmail"),
        ownerPassword: formData.get("ownerPassword"),
        moduleGym,
        moduleCourts,
      }),
    })

    const data = await res.json()
    if (res.ok) {
      router.push("/admin/tenants")
      router.refresh()
    } else {
      setError(data.error ?? "Something went wrong")
      setLoading(false)
    }
  }

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/tenants">
          <button className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Add New Gym</h1>
          <p className="text-sm text-muted-foreground">Create a new gym and set up the owner account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Gym Info */}
        <div className="rounded-lg border border-border bg-white shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-medium text-foreground">Gym Details</h2>
          </div>
          <div className="space-y-4 p-6">
            <div className="space-y-1.5">
              <label htmlFor="gymName" className="block text-sm font-medium text-foreground">
                Gym Name <span className="text-destructive">*</span>
              </label>
              <input
                id="gymName"
                name="gymName"
                placeholder="FitZone Lahore"
                required
                onChange={(e) => {
                  const slugInput = document.getElementById("slug") as HTMLInputElement
                  if (slugInput) slugInput.value = autoSlug(e.target.value)
                }}
                className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="slug" className="block text-sm font-medium text-foreground">
                URL Slug <span className="text-destructive">*</span>
              </label>
              <input
                id="slug"
                name="slug"
                placeholder="fitzone-lahore"
                required
                pattern="^[a-z0-9-]+$"
                className="block w-full rounded-md border border-border bg-white px-3 py-2 font-mono text-sm placeholder:font-sans placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground">Lowercase letters, numbers, hyphens only</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="contactEmail" className="block text-sm font-medium text-foreground">
                  Contact Email
                </label>
                <input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  placeholder="info@fitzone.pk"
                  className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="phone" className="block text-sm font-medium text-foreground">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  placeholder="0300-0000000"
                  className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="address" className="block text-sm font-medium text-foreground">
                Address
              </label>
              <input
                id="address"
                name="address"
                placeholder="Plot 12, DHA Phase 5, Lahore"
                className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Module Selection */}
        <div className="rounded-lg border border-border bg-white shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-medium text-foreground">What does this club offer?</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Select all that apply — this controls which features are visible.</p>
          </div>
          <div className="space-y-3 p-6">
            <button
              type="button"
              onClick={() => setModuleGym((v) => !v)}
              className={`flex w-full items-center gap-4 rounded-lg border-2 p-4 text-left transition-colors ${moduleGym ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"}`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${moduleGym ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                <Dumbbell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Gym / Fitness Club</p>
                <p className="text-xs text-muted-foreground">Members, Plans, Billing, Attendance, Trainers, Health tracking</p>
              </div>
              <div className={`ml-auto h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center ${moduleGym ? "border-primary bg-primary" : "border-border"}`}>
                {moduleGym && <span className="text-white text-xs leading-none">✓</span>}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setModuleCourts((v) => !v)}
              className={`flex w-full items-center gap-4 rounded-lg border-2 p-4 text-left transition-colors ${moduleCourts ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"}`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${moduleCourts ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                <Grid3x3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Court Bookings</p>
                <p className="text-xs text-muted-foreground">Padel, Cricket, Badminton, Squash — hourly slot bookings</p>
              </div>
              <div className={`ml-auto h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center ${moduleCourts ? "border-primary bg-primary" : "border-border"}`}>
                {moduleCourts && <span className="text-white text-xs leading-none">✓</span>}
              </div>
            </button>

            {!moduleGym && !moduleCourts && (
              <p className="text-sm text-red-600">Select at least one module.</p>
            )}
          </div>
        </div>

        {/* Owner Account */}
        <div className="rounded-lg border border-border bg-white shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-medium text-foreground">Owner Account</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              This person will be the gym owner — they log in and manage the gym
            </p>
          </div>
          <div className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="ownerFirstName" className="block text-sm font-medium text-foreground">
                  First Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="ownerFirstName"
                  name="ownerFirstName"
                  placeholder="Ahmed"
                  required
                  className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="ownerLastName" className="block text-sm font-medium text-foreground">
                  Last Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="ownerLastName"
                  name="ownerLastName"
                  placeholder="Khan"
                  required
                  className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ownerEmail" className="block text-sm font-medium text-foreground">
                Login Email <span className="text-destructive">*</span>
              </label>
              <input
                id="ownerEmail"
                name="ownerEmail"
                type="email"
                placeholder="ahmed@fitzone.pk"
                required
                className="block w-full rounded-md border border-border bg-white px-3 py-2 font-mono text-sm placeholder:font-sans placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ownerPassword" className="block text-sm font-medium text-foreground">
                Initial Password <span className="text-destructive">*</span>
              </label>
              <input
                id="ownerPassword"
                name="ownerPassword"
                type="password"
                placeholder="min. 8 characters"
                required
                minLength={8}
                className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground">Share this with the gym owner. They can change it later.</p>
            </div>
          </div>
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating gym…" : "Create Gym"}
          </Button>
          <Link href="/admin/tenants">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
