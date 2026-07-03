"use client"

import { useState } from "react"

export function GenerateButton() {
  const [loading, setLoading] = useState(false)

  async function run() {
    setLoading(true)
    const res = await fetch("/api/admin/billing/generate", { method: "POST" })
    setLoading(false)
    if (res.ok) {
      const data = await res.json()
      alert(`Generated ${data.invoicesCreated} invoice(s). Suspended ${data.tenantsSuspended} gym(s) for non-payment.`)
      window.location.reload()
    } else {
      alert("Failed to run billing cycle")
    }
  }

  return (
    <button
      onClick={run}
      disabled={loading}
      className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-60"
    >
      {loading ? "Running…" : "Generate This Month's Invoices"}
    </button>
  )
}
