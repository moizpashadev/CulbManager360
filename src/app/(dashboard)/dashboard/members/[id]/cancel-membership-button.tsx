"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type Props = { memberId: string; membershipId: string }

export function CancelMembershipButton({ memberId, membershipId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleCancel() {
    if (!confirm("Cancel this membership? The member's status will be set to Expired.")) return
    setLoading(true)

    await fetch(`/api/members/${memberId}/memberships`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membershipId }),
    })

    router.refresh()
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="rounded-md border border-destructive/40 bg-white px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/5 disabled:opacity-60"
    >
      {loading ? "Cancelling…" : "Cancel Membership"}
    </button>
  )
}
