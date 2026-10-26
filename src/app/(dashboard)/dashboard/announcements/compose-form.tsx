"use client"

import { useState } from "react"

type Branch = { id: string; name: string }
type Audience = "ALL" | "EXPIRING_SOON" | "OUTSTANDING_PAYMENT" | "BRANCH"

export function ComposeForm({ branches }: { branches: Branch[] }) {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [audience, setAudience] = useState<Audience>("ALL")
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "")
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function send() {
    setError(null)
    setResult(null)
    if (!title.trim() || !message.trim()) {
      setError("Title and message are both required")
      return
    }
    if (audience === "BRANCH" && !branchId) {
      setError("Pick a branch")
      return
    }

    setSending(true)
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message, audience, branchId: audience === "BRANCH" ? branchId : undefined }),
    })
    const data = await res.json().catch(() => ({}))
    setSending(false)

    if (!res.ok) {
      setError(data.error ?? "Failed to send announcement")
      return
    }

    setResult(`Sent to ${data.sentCount} of ${data.recipientCount} targeted members.`)
    setTitle("")
    setMessage("")
    setTimeout(() => window.location.reload(), 1200)
  }

  return (
    <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="e.g. Gym closed tomorrow"
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="e.g. We'll be closed for Eid on Monday. See you Tuesday!"
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Send to</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as Audience)}
              className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="ALL">All members</option>
              <option value="EXPIRING_SOON">Expiring in 7 days</option>
              <option value="OUTSTANDING_PAYMENT">Outstanding payment</option>
              <option value="BRANCH">A specific branch</option>
            </select>
          </div>

          {audience === "BRANCH" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Branch</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {result && <p className="text-sm text-green-700">{result}</p>}

        <button
          onClick={send}
          disabled={sending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {sending ? "Sending…" : "Send Announcement"}
        </button>
      </div>
    </div>
  )
}
