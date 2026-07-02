"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

const INPUT = "block w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
const LABEL = "block text-sm font-medium text-foreground"

type Branch = { id: string; name: string }

export default function NewTrainerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranches, setSelectedBranches] = useState<string[]>([])
  const [employmentType, setEmploymentType] = useState("")

  useEffect(() => {
    fetch("/api/branches").then((r) => r.json()).then(setBranches)
  }, [])

  function toggleBranch(id: string) {
    setSelectedBranches((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const fd = new FormData(e.currentTarget)
    const res = await fetch("/api/trainers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: fd.get("firstName"),
        lastName: fd.get("lastName"),
        email: fd.get("email"),
        password: fd.get("password"),
        specialization: fd.get("specialization") || null,
        bio: fd.get("bio") || null,
        employmentType: employmentType || null,
        salaryAmount: employmentType === "SALARIED" ? (fd.get("salaryAmount") || null) : null,
        commissionRate: employmentType === "COMMISSION" ? (fd.get("commissionRate") || null) : null,
        branchIds: selectedBranches,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      router.push(`/dashboard/trainers/${data.id}`)
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
        <Link href="/dashboard/trainers">
          <button className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Add Trainer</h1>
          <p className="text-sm text-muted-foreground">Hire a new trainer and configure their compensation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Personal info */}
        <div className="rounded-lg border border-border bg-white shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-medium text-foreground">Personal Information</h2>
          </div>
          <div className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="firstName" className={LABEL}>First Name <span className="text-destructive">*</span></label>
                <input id="firstName" name="firstName" required placeholder="Ali" className={INPUT} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="lastName" className={LABEL}>Last Name <span className="text-destructive">*</span></label>
                <input id="lastName" name="lastName" required placeholder="Hassan" className={INPUT} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="email" className={LABEL}>Email <span className="text-destructive">*</span></label>
              <input id="email" name="email" type="email" required placeholder="ali@fitzone.pk" className={INPUT + " font-mono placeholder:font-sans"} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className={LABEL}>Password <span className="text-destructive">*</span></label>
              <input id="password" name="password" type="password" required minLength={8} placeholder="min. 8 characters" className={INPUT} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="specialization" className={LABEL}>Specialization</label>
              <input id="specialization" name="specialization" placeholder="Strength & Conditioning, Yoga, CrossFit…" className={INPUT} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="bio" className={LABEL}>Bio</label>
              <textarea id="bio" name="bio" rows={2} placeholder="Short trainer profile…" className="block w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
        </div>

        {/* Employment */}
        <div className="rounded-lg border border-border bg-white shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-medium text-foreground">Employment & Compensation</h2>
          </div>
          <div className="space-y-4 p-6">
            <div className="space-y-2">
              <label className={LABEL}>Employment Type</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "SALARIED", label: "Salaried", desc: "Fixed monthly pay" },
                  { value: "COMMISSION", label: "Commission", desc: "% of member revenue" },
                  { value: "SELF_EMPLOYED", label: "Self-Employed", desc: "Charges own rates" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer flex-col rounded-md border p-3 transition-colors ${
                      employmentType === opt.value ? "border-primary bg-secondary/60" : "border-border hover:bg-muted/30"
                    }`}
                  >
                    <input
                      type="radio" name="employmentTypeRadio" value={opt.value}
                      checked={employmentType === opt.value}
                      onChange={() => setEmploymentType(opt.value)}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-foreground">{opt.label}</span>
                    <span className="mt-0.5 text-xs text-muted-foreground">{opt.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {employmentType === "SALARIED" && (
              <div className="space-y-1.5">
                <label htmlFor="salaryAmount" className={LABEL}>Monthly Salary (PKR)</label>
                <input id="salaryAmount" name="salaryAmount" type="number" min="0" step="500" placeholder="50000" className={INPUT + " font-mono"} />
              </div>
            )}

            {employmentType === "COMMISSION" && (
              <div className="space-y-1.5">
                <label htmlFor="commissionRate" className={LABEL}>Commission Rate (%)</label>
                <input id="commissionRate" name="commissionRate" type="number" min="0" max="100" step="0.5" placeholder="20" className={INPUT + " font-mono"} />
                <p className="text-xs text-muted-foreground">Applied to total paid invoices from this trainer&apos;s members each month.</p>
              </div>
            )}
          </div>
        </div>

        {/* Branch assignment */}
        <div className="rounded-lg border border-border bg-white shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-medium text-foreground">Branch Assignment</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Select branches where this trainer works</p>
          </div>
          <div className="p-6">
            {branches.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No branches found.{" "}
                <Link href="/dashboard/branches/new" className="text-primary hover:underline">Add a branch first.</Link>
              </p>
            ) : (
              <div className="space-y-2">
                {branches.map((b) => (
                  <label key={b.id} className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors ${
                    selectedBranches.includes(b.id) ? "border-primary bg-secondary/60" : "border-border hover:bg-muted/30"
                  }`}>
                    <input
                      type="checkbox" checked={selectedBranches.includes(b.id)}
                      onChange={() => toggleBranch(b.id)}
                      className="accent-primary"
                    />
                    <span className="text-sm font-medium text-foreground">{b.name}</span>
                    {selectedBranches[0] === b.id && (
                      <span className="ml-auto text-xs text-primary">Primary</span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Add Trainer"}</Button>
          <Link href="/dashboard/trainers"><Button variant="outline" type="button">Cancel</Button></Link>
        </div>
      </form>
    </div>
  )
}
