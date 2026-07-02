"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function AdminToggle({ adminId, isActive }: { adminId: string; isActive: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    await fetch(`/api/admin/admins/${adminId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <Button variant="ghost" size="sm" onClick={toggle} disabled={loading}>
      {isActive ? "Deactivate" : "Activate"}
    </Button>
  )
}
