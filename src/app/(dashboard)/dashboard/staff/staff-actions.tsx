"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function StaffActions({
  staffId,
  isActive,
  canDelete,
}: {
  staffId: string
  isActive: boolean
  canDelete: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    await fetch(`/api/staff/${staffId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    })
    router.refresh()
    setLoading(false)
  }

  async function remove() {
    if (!confirm("Remove this staff member?")) return
    setLoading(true)
    await fetch(`/api/staff/${staffId}`, { method: "DELETE" })
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-1">
      <Link href={`/dashboard/staff/${staffId}/edit`}>
        <Button variant="ghost" size="sm">Edit</Button>
      </Link>
      <Button variant="ghost" size="sm" onClick={toggle} disabled={loading}>
        {isActive ? "Deactivate" : "Activate"}
      </Button>
      {canDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={remove}
          disabled={loading}
          className="text-destructive hover:text-destructive"
        >
          Remove
        </Button>
      )}
    </div>
  )
}
