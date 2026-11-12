"use client"

import { useState } from "react"
import { UserPlus } from "lucide-react"

type Branch = { id: string; name: string }
type Props = { headMemberId: string; branches: Branch[] }

export function AddFamilyMemberButton({ headMemberId, branches }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    branchId: "",
  })

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First and last name are required")
      return
    }
    setLoading(true)
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        branchId: form.branchId || undefined,
        familyHeadId: headMemberId,
      }),
    })
    setLoading(false)
    if (res.ok) {
      window.location.reload()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Failed to add family member")
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
      >
        <UserPlus className="h-3.5 w-3.5" />
        Add Family Member
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="w-full space-y-3 rounded-md border border-border bg-secondary/40 p-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">First name</label>
          <input
            value={form.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">Last name</label>
          <input
            value={form.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">Email (optional)</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="Leave blank if none"
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">Phone (optional)</label>
          <input
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>
      {branches.length > 0 && (
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">Branch (optional)</label>
          <select
            value={form.branchId}
            onChange={(e) => set("branchId", e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">—</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/40"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? "Adding…" : "Add Family Member"}
        </button>
      </div>
    </form>
  )
}
