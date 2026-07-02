"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

type Props = { from: string; to: string }

export function DateRangePicker({ from, to }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [f, setF] = useState(from)
  const [t, setT] = useState(to)

  function apply() {
    const params = new URLSearchParams(searchParams.toString())
    params.set("from", f)
    params.set("to", t)
    router.push(`/dashboard/reports?${params}`)
  }

  function setPreset(months: number) {
    const now = new Date()
    const end = now.toISOString().slice(0, 10)
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1).toISOString().slice(0, 10)
    setF(start)
    setT(end)
    const params = new URLSearchParams(searchParams.toString())
    params.set("from", start)
    params.set("to", end)
    router.push(`/dashboard/reports?${params}`)
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[
          { label: "This month", m: 1 },
          { label: "3 months", m: 3 },
          { label: "6 months", m: 6 },
          { label: "This year", m: 12 },
        ].map(({ label, m }) => (
          <button
            key={m}
            onClick={() => setPreset(m)}
            className="rounded-full border border-border bg-white px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={f}
          onChange={(e) => setF(e.target.value)}
          className="h-8 rounded-md border border-border bg-white px-2 text-xs focus:border-primary focus:outline-none"
        />
        <span className="text-xs text-muted-foreground">→</span>
        <input
          type="date"
          value={t}
          onChange={(e) => setT(e.target.value)}
          className="h-8 rounded-md border border-border bg-white px-2 text-xs focus:border-primary focus:outline-none"
        />
        <button
          onClick={apply}
          className="h-8 rounded-md bg-primary px-3 text-xs font-medium text-white hover:bg-primary/90"
        >
          Apply
        </button>
      </div>
    </div>
  )
}
