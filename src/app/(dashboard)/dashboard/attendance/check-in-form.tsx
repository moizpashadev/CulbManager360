"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

type Member = { id: string; firstName: string; lastName: string; email: string }

export function CheckInForm({ members }: { members: Member[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [warning, setWarning] = useState("")
  const [search, setSearch] = useState("")

  const filtered = members.filter((m) => {
    const q = search.toLowerCase()
    return (
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    )
  })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")
    setWarning("")

    const fd = new FormData(e.currentTarget)
    const memberId = fd.get("memberId")

    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, method: "MANUAL" }),
    })

    const data = await res.json()
    if (res.ok) {
      const name = `${data.member.firstName} ${data.member.lastName}`
      setSuccess(`${name} checked in.`)
      if (data.warning) setWarning(data.warning)
      ;(e.target as HTMLFormElement).reset()
      setSearch("")
      router.refresh()
    } else {
      setError(data.error ?? "Check-in failed")
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">Search Member</label>
        <input
          type="text"
          placeholder="Name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="memberId" className="block text-sm font-medium text-foreground">
          Select Member
        </label>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active members found.</p>
        ) : (
          <select
            id="memberId"
            name="memberId"
            required
            size={Math.min(filtered.length + 1, 7)}
            className="block w-full rounded-md border border-border bg-white px-3 py-1 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {filtered.length === 0 ? (
              <option disabled value="">No results</option>
            ) : (
              filtered.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName}
                </option>
              ))
            )}
          </select>
        )}
      </div>

      {/* Warning: expired or no plan */}
      {warning && (
        <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
          ⚠ {warning}
        </div>
      )}
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      {success && !warning && (
        <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">{success}</p>
      )}
      {success && warning && (
        <p className="text-sm text-muted-foreground">{success}</p>
      )}

      <Button type="submit" disabled={loading || members.length === 0} className="w-full">
        {loading ? "Checking in…" : "Check In"}
      </Button>
    </form>
  )
}
