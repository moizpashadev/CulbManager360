"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

const INPUT = "block w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
const LABEL = "block text-sm font-medium text-foreground"

export default function NewBranchPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const fd = new FormData(e.currentTarget)
    const res = await fetch("/api/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        address: fd.get("address") || null,
        phone: fd.get("phone") || null,
        email: fd.get("email") || null,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      router.push(`/dashboard/branches/${data.id}`)
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard/branches">
          <button className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Add Branch</h1>
          <p className="text-sm text-muted-foreground">Create a new gym location</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-white shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-medium text-foreground">Branch Details</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="space-y-1.5">
            <label htmlFor="name" className={LABEL}>
              Branch Name <span className="text-destructive">*</span>
            </label>
            <input id="name" name="name" required placeholder="Main Campus, DHA Branch…" className={INPUT} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="address" className={LABEL}>Address</label>
            <input id="address" name="address" placeholder="Plot 12, Block 5, Clifton, Karachi" className={INPUT} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="phone" className={LABEL}>Phone</label>
              <input id="phone" name="phone" placeholder="021-35000000" className={INPUT} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="email" className={LABEL}>Email</label>
              <input id="email" name="email" type="email" placeholder="dha@fitzone.pk" className={INPUT + " font-mono placeholder:font-sans"} />
            </div>
          </div>

          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Add Branch"}</Button>
            <Link href="/dashboard/branches"><Button variant="outline" type="button">Cancel</Button></Link>
          </div>
        </form>
      </div>
    </div>
  )
}
