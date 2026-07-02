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

export function MemberEditForm({ member, branches = [] }: { member: Member; branches?: Branch[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

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
      {success && <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">Saved successfully.</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Save Changes"}
      </Button>
    </form>
  )
}
