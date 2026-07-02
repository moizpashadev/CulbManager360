"use client"

import { useState } from "react"

type Props = { membershipId: string; status: string }

export function MembershipPauseButton({ membershipId, status }: Props) {
  const [loading, setLoading] = useState(false)

  async function toggle() {
    const action = status === "ACTIVE" ? "pause" : "resume"
    if (!confirm(`${action === "pause" ? "Pause" : "Resume"} this membership?`)) return
    setLoading(true)
    const res = await fetch(`/api/memberships/${membershipId}/pause`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    setLoading(false)
    if (res.ok) {
      window.location.reload()
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? "Failed")
    }
  }

  if (status !== "ACTIVE" && status !== "PAUSED") return null

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
        status === "ACTIVE"
          ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
          : "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
      }`}
    >
      {loading ? "…" : status === "ACTIVE" ? "Pause Membership" : "Resume Membership"}
    </button>
  )
}
