"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

type Branch = { id: string; name: string }

const INPUT =
  "block w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
const LABEL = "block text-sm font-medium text-foreground"

export default function NewMemberPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [regFee, setRegFee] = useState(0)
  const [branches, setBranches] = useState<Branch[]>([])

  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then((data: Branch[]) => setBranches(data))
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const fd = new FormData(e.currentTarget)
    const res = await fetch("/api/members", {
      method: "POST",
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
        branchId: fd.get("branchId") || null,
        registrationFee: regFee > 0 ? regFee : null,
        registrationPaymentMethod: fd.get("registrationPaymentMethod") || null,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      router.push(`/dashboard/members/${data.id}?assign=true`)
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard/members">
          <button className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Add Member</h1>
          <p className="text-sm text-muted-foreground">Register a new member to your gym</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Personal Info ── */}
        <div className="rounded-lg border border-border bg-white shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-medium text-foreground">Personal Information</h2>
          </div>
          <div className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="firstName" className={LABEL}>
                  First Name <span className="text-destructive">*</span>
                </label>
                <input id="firstName" name="firstName" placeholder="Ali" required className={INPUT} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="lastName" className={LABEL}>
                  Last Name <span className="text-destructive">*</span>
                </label>
                <input id="lastName" name="lastName" placeholder="Khan" required className={INPUT} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className={LABEL}>
                Email Address <span className="text-destructive">*</span>
              </label>
              <input
                id="email" name="email" type="email" required placeholder="ali@example.com"
                className={INPUT + " font-mono placeholder:font-sans"}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="phone" className={LABEL}>Phone</label>
                <input id="phone" name="phone" placeholder="0300-0000000" className={INPUT} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="cnic" className={LABEL}>CNIC</label>
                <input
                  id="cnic" name="cnic" placeholder="42201-1234567-8"
                  className={INPUT + " font-mono placeholder:font-sans"}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="dateOfBirth" className={LABEL}>Date of Birth</label>
              <input id="dateOfBirth" name="dateOfBirth" type="date" className={INPUT} />
            </div>

            {branches.length > 0 && (
              <div className="space-y-1.5">
                <label htmlFor="branchId" className={LABEL}>Branch</label>
                <select id="branchId" name="branchId" className={INPUT}>
                  <option value="">— No branch assigned —</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ── Emergency Contact ── */}
        <div className="rounded-lg border border-border bg-white shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-medium text-foreground">Emergency Contact</h2>
          </div>
          <div className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="emergencyContact" className={LABEL}>Contact Name</label>
                <input id="emergencyContact" name="emergencyContact" placeholder="Fatima Khan" className={INPUT} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="emergencyPhone" className={LABEL}>Contact Phone</label>
                <input id="emergencyPhone" name="emergencyPhone" placeholder="0300-1111111" className={INPUT} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="medicalNotes" className={LABEL}>Medical Notes</label>
              <textarea
                id="medicalNotes" name="medicalNotes" rows={2}
                placeholder="Any conditions, allergies, or relevant health info…"
                className="block w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* ── Registration Fee ── */}
        <div className="rounded-lg border border-border bg-white shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-medium text-foreground">Registration Fee</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              One-time joining fee — generates an invoice linked to this member.
            </p>
          </div>
          <div className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="regFeeAmount" className={LABEL}>Amount (PKR)</label>
                <input
                  id="regFeeAmount" type="number" min="0" step="1"
                  value={regFee || ""}
                  onChange={(e) => setRegFee(parseFloat(e.target.value) || 0)}
                  placeholder="0 = no fee"
                  className={INPUT + " font-mono placeholder:font-sans"}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="registrationPaymentMethod" className={LABEL}>Payment Method</label>
                <select
                  id="registrationPaymentMethod" name="registrationPaymentMethod"
                  disabled={regFee === 0}
                  className={INPUT + " disabled:opacity-50"}
                >
                  <option value="">— Record later</option>
                  <option value="CASH">Cash</option>
                  <option value="EASYPAISA">Easypaisa</option>
                  <option value="JAZZCASH">JazzCash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Card</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
            </div>

            {regFee > 0 && (
              <div className="flex justify-between rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Registration invoice total</span>
                <span className="font-mono font-semibold text-foreground">
                  PKR {regFee.toLocaleString("en-PK")}
                </span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Add Member"}
          </Button>
          <Link href="/dashboard/members">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
