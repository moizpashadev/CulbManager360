"use client"

import { useState } from "react"

type Props = { tenantId: string }

const ROLES = [
  { value: "OWNER", label: "Owner" },
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "STAFF", label: "Staff" },
  { value: "TRAINER", label: "Trainer" },
]

export function AddStaffForm({ tenantId }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const fd = new FormData(e.currentTarget)
    const res = await fetch(`/api/admin/tenants/${tenantId}/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: fd.get("firstName"),
        lastName: fd.get("lastName"),
        email: fd.get("email"),
        password: fd.get("password"),
        role: fd.get("role"),
      }),
    })

    if (res.ok) {
      setOpen(false)
      window.location.reload()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Failed to add staff member")
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40"
      >
        {open ? "Cancel" : "+ Add Staff"}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="w-full basis-full space-y-3 border-b border-border bg-muted/20 p-6">
          <div className="grid grid-cols-2 gap-3">
            <input
              name="firstName" required placeholder="First name"
              className="rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              name="lastName" required placeholder="Last name"
              className="rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <input
            name="email" type="email" required placeholder="Login email"
            className="w-full rounded-md border border-border bg-white px-3 py-2 font-mono text-sm placeholder:font-sans placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            name="password" type="password" required minLength={8} placeholder="Initial password (min. 8 characters)"
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <select
            name="role" defaultValue="STAFF"
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/40">
              Cancel
            </button>
            <button
              type="submit" disabled={loading}
              className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? "Adding…" : "Add Staff Member"}
            </button>
          </div>
        </form>
      )}
    </>
  )
}
