"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Record = {
  id: string
  checkedInAt: Date | string
  checkedOutAt: Date | string | null
  method: string
  member: { id: string; firstName: string; lastName: string }
}

function duration(inAt: Date | string, outAt: Date | string) {
  const ms = new Date(outAt).getTime() - new Date(inAt).getTime()
  const mins = Math.round(ms / 60000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function CheckOutButton({ recordId }: { recordId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleCheckOut() {
    setLoading(true)
    await fetch(`/api/attendance/${recordId}`, { method: "PUT" })
    router.refresh()
    setLoading(false)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCheckOut} disabled={loading}>
      {loading ? "…" : "Check Out"}
    </Button>
  )
}

export function AttendanceLog({ records }: { records: Record[] }) {
  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No check-ins recorded today.
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {records.map((r) => (
        <div key={r.id} className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary">
              {r.member.firstName[0]}{r.member.lastName[0]}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {r.member.firstName} {r.member.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                In: {new Date(r.checkedInAt).toLocaleTimeString("en-PK", { timeStyle: "short" })}
                {r.checkedOutAt && (
                  <>
                    {" · "}Out: {new Date(r.checkedOutAt).toLocaleTimeString("en-PK", { timeStyle: "short" })}
                    {" · "}{duration(r.checkedInAt, r.checkedOutAt)}
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={r.checkedOutAt ? "secondary" : "success"}>
              {r.checkedOutAt ? "Out" : "In"}
            </Badge>
            {!r.checkedOutAt && <CheckOutButton recordId={r.id} />}
          </div>
        </div>
      ))}
    </div>
  )
}
