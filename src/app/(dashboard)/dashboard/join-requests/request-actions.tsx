"use client"

import { useState } from "react"

export function RequestActions({ id }: { id: string }) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null)

  async function act(action: "approve" | "reject") {
    setLoading(action)
    const res = await fetch(`/api/join-requests/${id}/${action}`, { method: "POST" })
    if (res.ok) {
      window.location.reload()
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? `Failed to ${action}`)
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => act("approve")}
        disabled={loading !== null}
        className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-60"
      >
        {loading === "approve" ? "Approving…" : "Approve"}
      </button>
      <button
        onClick={() => act("reject")}
        disabled={loading !== null}
        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 disabled:opacity-60"
      >
        {loading === "reject" ? "Rejecting…" : "Reject"}
      </button>
    </div>
  )
}
