"use client"

import { useState } from "react"

export function MarkPaidButton({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = useState(false)

  async function markPaid() {
    if (!confirm("Mark this invoice as paid and reactivate the gym (if suspended)?")) return
    setLoading(true)
    const res = await fetch(`/api/admin/invoices/${invoiceId}/mark-paid`, { method: "PATCH" })
    setLoading(false)
    if (res.ok) {
      window.location.reload()
    } else {
      alert("Failed to update invoice")
    }
  }

  return (
    <button
      onClick={markPaid}
      disabled={loading}
      className="rounded-md border border-primary px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/5 disabled:opacity-60"
    >
      {loading ? "Saving…" : "Mark as Paid"}
    </button>
  )
}
