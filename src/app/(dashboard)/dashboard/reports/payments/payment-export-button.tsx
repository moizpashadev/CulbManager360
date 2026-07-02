"use client"

import { Download } from "lucide-react"
import { useState } from "react"

interface Props {
  from: string
  to: string
  method?: string
  type?: string
  status?: string
}

export function PaymentExportButton({ from, to, method, type, status }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    const params = new URLSearchParams({ from, to })
    if (method) params.set("method", method)
    if (type) params.set("type", type)
    if (status) params.set("status", status)

    const res = await fetch(`/api/reports/payments/export?${params.toString()}`)
    if (!res.ok) {
      alert("Export failed. Please try again.")
      setLoading(false)
      return
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `payment-report-${from}-to-${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setLoading(false)
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted/40 disabled:opacity-60"
    >
      <Download className="h-4 w-4" />
      {loading ? "Exporting…" : "Export CSV"}
    </button>
  )
}
