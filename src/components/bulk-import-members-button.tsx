"use client"

import { useRef, useState } from "react"
import { Upload } from "lucide-react"

type Result = { created: number; skipped: { row: number; reason: string }[] }

export function BulkImportMembersButton({ endpoint }: { endpoint: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload() {
    const file = fileRef.current?.files?.[0]
    if (!file) { setError("Choose a CSV file first"); return }
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const csv = await file.text()
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? "Upload failed")
      } else {
        setResult(data)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-1.5 rounded-md border border-border bg-white px-3 text-sm font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground"
      >
        <Upload className="h-3.5 w-3.5" />
        Bulk Upload
      </button>
    )
  }

  return (
    <div className="w-full rounded-lg border border-border bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Bulk Upload Members</h3>
        <button onClick={() => { setOpen(false); setResult(null); setError(null) }} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        CSV with <strong>Name</strong>, <strong>Mobile</strong>, and <strong>Email</strong> columns (that order or any order,
        matched by header name). Everything else can be filled in per-member afterward.
      </p>

      <a
        href={`data:text/csv;charset=utf-8,${encodeURIComponent("Name,Mobile,Email\nJohn Doe,03001234567,john@example.com\n")}`}
        download="members-template.csv"
        className="mb-3 inline-block text-xs text-primary hover:underline"
      >
        Download CSV template
      </a>

      <div className="flex items-center gap-3">
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="text-sm" />
        <button
          onClick={handleUpload}
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? "Uploading…" : "Upload"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-3 rounded-md border border-border bg-secondary/40 p-3 text-sm">
          <p className="font-medium text-foreground">{result.created} member{result.created !== 1 ? "s" : ""} created.</p>
          {result.skipped.length > 0 && (
            <>
              <p className="mt-1 text-xs text-muted-foreground">{result.skipped.length} row(s) skipped:</p>
              <ul className="mt-1 max-h-32 space-y-0.5 overflow-y-auto text-xs text-muted-foreground">
                {result.skipped.map((s, i) => (
                  <li key={i}>Row {s.row}: {s.reason}</li>
                ))}
              </ul>
            </>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-3 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40"
          >
            Done — refresh list
          </button>
        </div>
      )}
    </div>
  )
}
