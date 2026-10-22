"use client"

import { useState } from "react"
import { Send } from "lucide-react"

type Props = { memberId: string }

export function InviteToPortalButton({ memberId }: Props) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function invite() {
    setLoading(true)
    const res = await fetch(`/api/members/${memberId}/invite`, { method: "POST" })
    setLoading(false)
    if (res.ok) {
      setSent(true)
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? "Failed to send invite")
    }
  }

  if (sent) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
        <Send className="h-3.5 w-3.5" />
        Invite sent
      </span>
    )
  }

  return (
    <button
      onClick={invite}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors disabled:opacity-60"
    >
      <Send className="h-3.5 w-3.5" />
      {loading ? "Sending…" : "Invite to Portal"}
    </button>
  )
}
