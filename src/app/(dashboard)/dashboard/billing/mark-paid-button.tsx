"use client"

import { useState } from "react"

const METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "EASYPAISA", label: "Easypaisa" },
  { value: "JAZZCASH", label: "JazzCash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CARD", label: "Card" },
  { value: "CHEQUE", label: "Cheque" },
]

type Props = { invoiceId: string; total: number; paidAmount?: number }

export function MarkPaidButton({ invoiceId, total, paidAmount = 0 }: Props) {
  const remaining = total - paidAmount
  const [open, setOpen] = useState(false)
  const [method, setMethod] = useState("CASH")
  const [amount, setAmount] = useState(String(remaining))
  const [loading, setLoading] = useState(false)

  async function handlePay() {
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) {
      alert("Enter a valid amount")
      return
    }
    setLoading(true)
    const res = await fetch(`/api/billing/${invoiceId}/pay`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethod: method, amount: numAmount }),
    })
    setLoading(false)
    if (res.ok) {
      setOpen(false)
      window.location.reload()
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? "Failed to process payment")
    }
  }

  const numAmount = parseFloat(amount) || 0
  const isPartial = numAmount < remaining
  const label = isPartial
    ? `Mark Partial (PKR ${numAmount.toLocaleString("en-PK")})`
    : `Mark Paid (PKR ${numAmount.toLocaleString("en-PK")})`

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-primary/40 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10"
      >
        {paidAmount > 0 ? "Collect Balance" : "Mark Paid"}
      </button>
    )
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-muted-foreground">Amount (PKR)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={1}
          max={remaining}
          className="h-7 w-28 rounded border border-border bg-white px-2 text-xs tabular-nums focus:border-primary focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-muted-foreground">Method</label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="h-7 rounded border border-border bg-white px-2 text-xs"
        >
          {METHODS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>
      <button
        onClick={handlePay}
        disabled={loading || numAmount <= 0}
        className="h-7 rounded-md bg-primary px-2.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-60"
      >
        {loading ? "…" : label}
      </button>
      <button onClick={() => setOpen(false)} className="h-7 text-xs text-muted-foreground hover:text-foreground">
        ✕
      </button>
    </div>
  )
}
