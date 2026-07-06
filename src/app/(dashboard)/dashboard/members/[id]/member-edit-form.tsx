"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

type Branch = { id: string; name: string }

type Member = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  cnic: string | null
  dateOfBirth: Date | null
  emergencyContact: string | null
  emergencyPhone: string | null
  medicalNotes: string | null
  status: string
  branchId?: string | null
}

const INPUT =
  "block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
const LABEL = "block text-sm font-medium text-foreground"
const STATUS_OPTIONS = ["ACTIVE", "INACTIVE", "SUSPENDED", "EXPIRED"]

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700 border-green-200",
  INACTIVE: "bg-gray-50 text-gray-600 border-gray-200",
  SUSPENDED: "bg-red-50 text-red-700 border-red-200",
  EXPIRED: "bg-amber-50 text-amber-700 border-amber-200",
}

export function MemberEditForm({ member, branches = [] }: { member: Member; branches?: Branch[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const branchName = branches.find((b) => b.id === member.branchId)?.name

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setError("")

    const fd = new FormData(e.currentTarget)
    const res = await fetch(`/api/members/${member.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: fd.get("firstName"),
        lastName: fd.get("lastName"),
        email: fd.get("email"),
        phone: fd.get("phone") || null,
        cnic: fd.get("cnic") || null,
        dateOfBirth: fd.get("dateOfBirth") || null,
        emergencyContact: fd.get("emergencyContact") || null,
        emergencyPhone: fd.get("emergencyPhone") || null,
        medicalNotes: fd.get("medicalNotes") || null,
        status: fd.get("status"),
        branchId: fd.get("branchId") || null,
      }),
    })

    if (res.ok) {
      setSuccess(true)
      setEditing(false)
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? "Save failed")
    }
    setLoading(false)
  }

  const dob = member.dateOfBirth
    ? new Date(member.dateOfBirth).toISOString().split("T")[0]
    : ""

  return (
    <div className="rounded-lg border border-border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-sm font-medium text-foreground">Member Details</h2>
        <button
          onClick={() => setEditing((v) => !v)}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40"
        >
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      {success && (
        <p className="mx-6 mt-4 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">Saved successfully.</p>
      )}

      {!editing ? (
        <dl className="divide-y divide-border">
          <div className="flex items-start justify-between gap-4 px-6 py-3">
            <dt className="shrink-0 text-xs text-muted-foreground">Full Name</dt>
            <dd className="text-right text-sm font-medium text-foreground">{member.firstName} {member.lastName}</dd>
          </div>
          <div className="flex items-start justify-between gap-4 px-6 py-3">
            <dt className="shrink-0 text-xs text-muted-foreground">Email</dt>
            <dd className="font-mono text-right text-sm font-medium text-foreground">{member.email}</dd>
          </div>
          <div className="flex items-start justify-between gap-4 px-6 py-3">
            <dt className="shrink-0 text-xs text-muted-foreground">Status</dt>
            <dd className="text-right">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[member.status] ?? ""}`}>
                {member.status.charAt(0) + member.status.slice(1).toLowerCase()}
              </span>
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4 px-6 py-3">
            <dt className="shrink-0 text-xs text-muted-foreground">Phone</dt>
            <dd className="text-right text-sm font-medium text-foreground">{member.phone ?? "—"}</dd>
          </div>
          <div className="flex items-start justify-between gap-4 px-6 py-3">
            <dt className="shrink-0 text-xs text-muted-foreground">CNIC</dt>
            <dd className="font-mono text-right text-sm font-medium text-foreground">{member.cnic ?? "—"}</dd>
          </div>
          <div className="flex items-start justify-between gap-4 px-6 py-3">
            <dt className="shrink-0 text-xs text-muted-foreground">Date of Birth</dt>
            <dd className="text-right text-sm font-medium text-foreground">
              {member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString("en-PK") : "—"}
            </dd>
          </div>
          {branches.length > 0 && (
            <div className="flex items-start justify-between gap-4 px-6 py-3">
              <dt className="shrink-0 text-xs text-muted-foreground">Branch</dt>
              <dd className="text-right text-sm font-medium text-foreground">{branchName ?? "— No branch assigned —"}</dd>
            </div>
          )}
          <div className="flex items-start justify-between gap-4 px-6 py-3">
            <dt className="shrink-0 text-xs text-muted-foreground">Emergency Contact</dt>
            <dd className="text-right text-sm font-medium text-foreground">
              {member.emergencyContact
                ? `${member.emergencyContact}${member.emergencyPhone ? ` · ${member.emergencyPhone}` : ""}`
                : "—"}
            </dd>
          </div>
          {member.medicalNotes && (
            <div className="px-6 py-3">
              <dt className="text-xs text-muted-foreground">Medical Notes</dt>
              <dd className="mt-1 text-sm text-foreground">{member.medicalNotes}</dd>
            </div>
          )}
        </dl>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="firstName" className={LABEL}>First Name</label>
              <input id="firstName" name="firstName" defaultValue={member.firstName} required className={INPUT} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="lastName" className={LABEL}>Last Name</label>
              <input id="lastName" name="lastName" defaultValue={member.lastName} required className={INPUT} />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className={LABEL}>Email</label>
            <input id="email" name="email" type="email" defaultValue={member.email} required className={INPUT + " font-mono"} />
          </div>

          {/* Phone + CNIC */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="phone" className={LABEL}>Phone</label>
              <input id="phone" name="phone" defaultValue={member.phone ?? ""} placeholder="0300-0000000" className={INPUT} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="cnic" className={LABEL}>CNIC</label>
              <input id="cnic" name="cnic" defaultValue={member.cnic ?? ""} placeholder="42201-1234567-8" className={INPUT + " font-mono"} />
            </div>
          </div>

          {/* DOB + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="dateOfBirth" className={LABEL}>Date of Birth</label>
              <input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={dob} className={INPUT} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="status" className={LABEL}>Status</label>
              <select id="status" name="status" defaultValue={member.status} className={INPUT}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Branch */}
          {branches.length > 0 && (
            <div className="space-y-1.5">
              <label htmlFor="branchId" className={LABEL}>Branch</label>
              <select id="branchId" name="branchId" defaultValue={member.branchId ?? ""} className={INPUT}>
                <option value="">— No branch assigned —</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Emergency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="emergencyContact" className={LABEL}>Emergency Contact Name</label>
              <input id="emergencyContact" name="emergencyContact" defaultValue={member.emergencyContact ?? ""} placeholder="Fatima Khan" className={INPUT} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="emergencyPhone" className={LABEL}>Emergency Phone</label>
              <input id="emergencyPhone" name="emergencyPhone" defaultValue={member.emergencyPhone ?? ""} placeholder="0300-1111111" className={INPUT} />
            </div>
          </div>

          {/* Medical notes */}
          <div className="space-y-1.5">
            <label htmlFor="medicalNotes" className={LABEL}>Medical Notes</label>
            <textarea
              id="medicalNotes" name="medicalNotes" rows={2}
              defaultValue={member.medicalNotes ?? ""}
              placeholder="Conditions, allergies, contraindications…"
              className="block w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
