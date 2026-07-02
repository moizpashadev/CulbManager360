"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

type Branch = { id: string; name: string }
type Slot = { id: string; dayOfWeek: number; startTime: string; endTime: string; capacity: number; branch: { id: string; name: string }; _count: { assignments: number } }
type Member = { id: string; firstName: string; lastName: string; email: string }

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

// ── Trainer Check-In/Out ────────────────────────────────────────────────────

export function TrainerCheckinButton({
  trainerId, branches, todayAttendance,
}: {
  trainerId: string
  branches: Branch[]
  todayAttendance: { id: string; checkedOutAt: string | null; branch: { name: string } } | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "")

  const isIn = todayAttendance && !todayAttendance.checkedOutAt

  async function handleCheckIn() {
    setLoading(true)
    await fetch(`/api/trainers/${trainerId}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branchId }),
    })
    setLoading(false)
    router.refresh()
  }

  async function handleCheckOut() {
    setLoading(true)
    await fetch(`/api/trainers/${trainerId}/checkin`, { method: "PATCH" })
    setLoading(false)
    router.refresh()
  }

  if (isIn) {
    return (
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
          <span className="h-2 w-2 rounded-full bg-primary"></span>
          Checked in at {todayAttendance!.branch.name}
        </span>
        <button
          onClick={handleCheckOut}
          disabled={loading}
          className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40 disabled:opacity-60"
        >
          {loading ? "…" : "Check Out"}
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {branches.length > 1 && (
        <select
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          className="rounded-md border border-border bg-white px-2 py-1.5 text-sm"
        >
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}
      <Button onClick={handleCheckIn} disabled={loading || !branchId} size="sm">
        {loading ? "…" : "Check In"}
      </Button>
    </div>
  )
}

// ── Add Slot Form ───────────────────────────────────────────────────────────

export function AddSlotForm({ trainerId, branches }: { trainerId: string; branches: Branch[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    const res = await fetch(`/api/trainers/${trainerId}/slots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        branchId: fd.get("branchId"),
        dayOfWeek: parseInt(fd.get("dayOfWeek") as string),
        startTime: fd.get("startTime"),
        endTime: fd.get("endTime"),
        capacity: parseInt(fd.get("capacity") as string) || 1,
      }),
    })
    if (res.ok) {
      setOpen(false)
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to add slot")
    }
    setLoading(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary"
      >
        + Add Availability Slot
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-primary/30 bg-secondary/30 p-4 space-y-3">
      <p className="text-sm font-medium text-foreground">New Availability Slot</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Branch</label>
          <select name="branchId" required className="block w-full rounded border border-border bg-white px-2 py-1.5 text-sm">
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Day</label>
          <select name="dayOfWeek" required className="block w-full rounded border border-border bg-white px-2 py-1.5 text-sm">
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Start Time</label>
          <input type="time" name="startTime" required className="block w-full rounded border border-border bg-white px-2 py-1.5 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">End Time</label>
          <input type="time" name="endTime" required className="block w-full rounded border border-border bg-white px-2 py-1.5 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Max Members</label>
          <input type="number" name="capacity" min="1" max="20" defaultValue="1" className="block w-full rounded border border-border bg-white px-2 py-1.5 font-mono text-sm" />
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-60">
          {loading ? "Saving…" : "Save Slot"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
    </form>
  )
}

// ── Delete Slot Button ──────────────────────────────────────────────────────

export function DeleteSlotButton({ trainerId, slotId }: { trainerId: string; slotId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm("Remove this slot?")) return
    setLoading(true)
    const res = await fetch(`/api/trainers/${trainerId}/slots/${slotId}`, { method: "DELETE" })
    if (!res.ok) {
      const d = await res.json()
      alert(d.error ?? "Cannot delete slot")
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="text-xs text-destructive/60 hover:text-destructive disabled:opacity-50">
      {loading ? "…" : "Remove"}
    </button>
  )
}

// ── Assign Member Form ──────────────────────────────────────────────────────

export function AssignMemberForm({
  trainerId, branches, slots,
}: {
  trainerId: string
  branches: Branch[]
  slots: Slot[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "")
  const [members, setMembers] = useState<Member[]>([])
  const [search, setSearch] = useState("")

  const today = new Date().toISOString().split("T")[0]

  useEffect(() => {
    if (!open) return
    fetch("/api/members").then((r) => r.json()).then(setMembers)
  }, [open])

  const filtered = members.filter((m) => {
    const q = search.toLowerCase()
    return `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(q)
  })

  const availableSlots = slots.filter((s) => s.branch.id === branchId && s._count.assignments < s.capacity)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    const res = await fetch(`/api/trainers/${trainerId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: fd.get("memberId"),
        branchId,
        slotId: fd.get("slotId") || null,
        startDate: fd.get("startDate"),
        notes: fd.get("notes") || null,
      }),
    })
    if (res.ok) {
      setOpen(false)
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to assign member")
    }
    setLoading(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
      >
        + Assign Member
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-primary/30 bg-secondary/30 p-4 space-y-3">
      <p className="text-sm font-medium text-foreground">Assign Member to Trainer</p>

      {branches.length > 1 && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Branch</label>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="block w-full rounded border border-border bg-white px-2 py-1.5 text-sm">
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Search Member</label>
        <input
          type="text" placeholder="Name or email…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full rounded border border-border bg-white px-2 py-1.5 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Member</label>
        <select name="memberId" required size={Math.min(filtered.length + 1, 5)} className="block w-full rounded border border-border bg-white px-2 py-1 text-sm">
          {filtered.map((m) => (
            <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Assign to Slot (optional)</label>
        <select name="slotId" className="block w-full rounded border border-border bg-white px-2 py-1.5 text-sm">
          <option value="">— No specific slot</option>
          {availableSlots.map((s) => (
            <option key={s.id} value={s.id}>
              {DAYS[s.dayOfWeek]} {s.startTime}–{s.endTime} · {s.branch.name} ({s._count.assignments}/{s.capacity})
            </option>
          ))}
        </select>
        {availableSlots.length === 0 && slots.length > 0 && (
          <p className="text-xs text-warning">All slots for this branch are at capacity.</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Start Date</label>
        <input type="date" name="startDate" required defaultValue={today} className="block w-full rounded border border-border bg-white px-2 py-1.5 text-sm" />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Notes</label>
        <input type="text" name="notes" placeholder="Goals, focus areas…" className="block w-full rounded border border-border bg-white px-2 py-1.5 text-sm" />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-60">
          {loading ? "Assigning…" : "Assign Member"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
    </form>
  )
}

// ── Remove Assignment Button ────────────────────────────────────────────────

export function RemoveAssignmentButton({ trainerId, assignmentId }: { trainerId: string; assignmentId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handle() {
    if (!confirm("Remove this member from trainer?")) return
    setLoading(true)
    await fetch(`/api/trainers/${trainerId}/members/${assignmentId}`, { method: "PATCH" })
    setLoading(false)
    router.refresh()
  }

  return (
    <button onClick={handle} disabled={loading} className="text-xs text-destructive/60 hover:text-destructive disabled:opacity-50">
      {loading ? "…" : "Remove"}
    </button>
  )
}
