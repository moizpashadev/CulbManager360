"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, X } from "lucide-react"

type Branch = { id: string; name: string }

type Props = {
  trainerId: string
  allBranches: Branch[]
  defaultValues: {
    firstName: string
    lastName: string
    email: string
    specialization: string
    bio: string
    employmentType: string
    salaryAmount: string
    commissionRate: string
    isActive: boolean
    branchIds: string[]
  }
}

const EMPLOYMENT_TYPES = [
  { value: "", label: "Not set" },
  { value: "SALARIED", label: "Salaried" },
  { value: "COMMISSION", label: "Commission-Based" },
  { value: "SELF_EMPLOYED", label: "Self-Employed" },
]

export function TrainerEditForm({ trainerId, allBranches, defaultValues }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [firstName, setFirstName] = useState(defaultValues.firstName)
  const [lastName, setLastName] = useState(defaultValues.lastName)
  const [specialization, setSpecialization] = useState(defaultValues.specialization)
  const [bio, setBio] = useState(defaultValues.bio)
  const [employmentType, setEmploymentType] = useState(defaultValues.employmentType)
  const [salaryAmount, setSalaryAmount] = useState(defaultValues.salaryAmount)
  const [commissionRate, setCommissionRate] = useState(defaultValues.commissionRate)
  const [isActive, setIsActive] = useState(defaultValues.isActive)
  const [branchIds, setBranchIds] = useState<string[]>(defaultValues.branchIds)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleBranch(id: string) {
    setBranchIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) { setError("First and last name are required."); return }

    setSaving(true)
    setError(null)

    const res = await fetch(`/api/trainers/${trainerId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        specialization: specialization.trim() || null,
        bio: bio.trim() || null,
        employmentType: employmentType || null,
        salaryAmount: salaryAmount ? parseFloat(salaryAmount) : null,
        commissionRate: commissionRate ? parseFloat(commissionRate) : null,
        isActive,
        branchIds,
      }),
    })

    if (res.ok) {
      setOpen(false)
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to save.")
    }
    setSaving(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/40"
      >
        <Pencil className="h-3.5 w-3.5" /> Edit Profile
      </button>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Edit Trainer Profile</h3>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">First Name *</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Last Name *</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">Specialization</label>
          <input
            type="text"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            placeholder="e.g. Strength & Conditioning"
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">Employment Type</label>
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {EMPLOYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {employmentType === "SALARIED" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Monthly Salary (PKR)</label>
            <input
              type="number"
              min="0"
              value={salaryAmount}
              onChange={(e) => setSalaryAmount(e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}

        {employmentType === "COMMISSION" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Commission Rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}

        {allBranches.length > 0 && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">Assigned Branches</label>
            <div className="flex flex-wrap gap-2">
              {allBranches.map((b) => (
                <label key={b.id} className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={branchIds.includes(b.id)}
                    onChange={() => toggleBranch(b.id)}
                    className="h-3.5 w-3.5 rounded border-border text-primary"
                  />
                  <span className="text-sm text-foreground">{b.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="trainerActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary"
          />
          <label htmlFor="trainerActive" className="text-sm text-foreground">Active</label>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
