"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type Props = {
  staffId: string
  defaultValues: { firstName: string; lastName: string; role: string; isActive: boolean }
  isOwnerAccount: boolean
}

const ROLES = ["ADMIN", "MANAGER", "STAFF"]

export function StaffEditForm({ staffId, defaultValues, isOwnerAccount }: Props) {
  const router = useRouter()
  const [firstName, setFirstName] = useState(defaultValues.firstName)
  const [lastName, setLastName] = useState(defaultValues.lastName)
  const [role, setRole] = useState(defaultValues.role)
  const [isActive, setIsActive] = useState(defaultValues.isActive)
  const [password, setPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) { setError("First and last name are required."); return }

    setSaving(true)
    setError(null)

    const body: Record<string, unknown> = { firstName: firstName.trim(), lastName: lastName.trim(), isActive }
    if (!isOwnerAccount) body.role = role
    if (password) body.password = password

    const res = await fetch(`/api/staff/${staffId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      router.push("/dashboard/staff")
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to save.")
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">First Name *</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Last Name *</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {!isOwnerAccount && (
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          New Password{" "}
          <span className="font-normal text-muted-foreground">(leave blank to keep current)</span>
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary"
        />
        <label htmlFor="isActive" className="text-sm text-foreground">Active (can log in)</label>
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
        <Link href="/dashboard/staff">
          <button type="button" className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40">
            Cancel
          </button>
        </Link>
      </div>
    </form>
  )
}
