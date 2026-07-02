"use client"

import { useState } from "react"
import { PlusCircle } from "lucide-react"

type Props = { memberId: string }

const TYPES = [
  { value: "MEMBERSHIP", label: "Membership" },
  { value: "RENEWAL", label: "Renewal" },
  { value: "REGISTRATION", label: "Registration" },
  { value: "OTHER", label: "Other" },
]

export function GenerateInvoiceButton({ memberId }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    type: "MEMBERSHIP",
    description: "",
    amount: "",
    discount: "0",
    dueDate: "",
    notes: "",
  })

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) { alert("Enter a valid amount"); return }
    setLoading(true)
    const res = await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId,
        type: form.type,
        description: form.description || undefined,
        subtotal: amount,
        discount: parseFloat(form.discount) || 0,
        dueDate: form.dueDate || undefined,
        notes: form.notes || undefined,
      }),
    })
    setLoading(false)
    if (res.ok) {
      setOpen(false)
      window.location.reload()
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? "Failed to create invoice")
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground"
      >
        <PlusCircle className="h-3.5 w-3.5" />
        Generate Invoice
      </button>
    )
  }

  const subtotal = parseFloat(form.amount) || 0
  const discount = parseFloat(form.discount) || 0
  const total = Math.max(0, subtotal - discount)

  return (
    <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Generate Invoice</h3>
        <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Type</label>
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="e.g. July 2026"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Amount (PKR)</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              min={1}
              required
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Discount (PKR)</label>
            <input
              type="number"
              value={form.discount}
              onChange={(e) => set("discount", e.target.value)}
              min={0}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">
              Total: <span className="font-mono text-primary">PKR {total.toLocaleString("en-PK")}</span>
            </label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
              placeholder="Due date (optional)"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">Notes (optional)</label>
          <input
            type="text"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/40"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create Invoice"}
          </button>
        </div>
      </form>
    </div>
  )
}
