"use client"

import { useState } from "react"
import { UserRoundPlus } from "lucide-react"

type Props = { memberId: string; defaultFee?: number }

export function LogGuestVisitButton({ memberId, defaultFee }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [guestName, setGuestName] = useState("")
  const [fee, setFee] = useState(defaultFee ? String(defaultFee) : "")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const feeAmount = parseFloat(fee)
    if (!guestName.trim()) {
      setError("Guest name is required")
      return
    }
    if (!feeAmount || feeAmount <= 0) {
      setError("Enter a valid fee")
      return
    }
    setLoading(true)
    const res = await fetch(`/api/members/${memberId}/guest-visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestName: guestName.trim(), fee: feeAmount }),
    })
    setLoading(false)
    if (res.ok) {
      window.location.reload()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Failed to log guest visit")
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground"
      >
        <UserRoundPlus className="h-3.5 w-3.5" />
        Log Guest Visit
      </button>

      {open && (
        <form
          onSubmit={submit}
          className="absolute right-0 top-full z-10 mt-2 w-72 space-y-3 rounded-lg border border-border bg-white p-4 shadow-md"
        >
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Guest name</label>
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              autoFocus
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Fee (PKR)</label>
            <input
              type="number"
              min={1}
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? "Logging…" : "Log Visit"}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
