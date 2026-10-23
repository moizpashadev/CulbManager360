"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { MemberPageHeader } from "@/components/member-page-header"
import { Search, Building2 } from "lucide-react"

type Gym = { id: string; name: string; slug: string; alreadyLinked: boolean; requestPending: boolean }

export default function FindGymPage() {
  const [q, setQ] = useState("")
  const [gyms, setGyms] = useState<Gym[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Gym | null>(null)
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", message: "" })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [sentFor, setSentFor] = useState<string | null>(null)

  async function search(e: React.FormEvent) {
    e.preventDefault()
    if (q.trim().length < 2) return
    setSearching(true)
    const res = await fetch(`/api/member/gyms/search?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setGyms(data.gyms ?? [])
    setSearching(false)
  }

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setSubmitting(true)
    setError("")
    const res = await fetch("/api/member/join-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: selected.id, ...form }),
    })
    setSubmitting(false)
    if (res.ok) {
      setSentFor(selected.name)
      setSelected(null)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Failed to send request")
    }
  }

  return (
    <div className="space-y-6">
      <MemberPageHeader
        icon={Search}
        title="Find Your Gym"
        description="Search for your gym and ask to be added — they'll review and approve your request."
      />

      {sentFor && (
        <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
          Request sent to <strong>{sentFor}</strong>. They&apos;ll review it and you&apos;ll see it on your{" "}
          <a href="/portal" className="text-primary hover:underline">home page</a> once approved.
        </div>
      )}

      <form onSubmit={search} className="flex gap-2">
        <Input
          placeholder="Search by gym name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="submit" disabled={searching}>
          <Search className="mr-1.5 h-4 w-4" />
          {searching ? "Searching…" : "Search"}
        </Button>
      </form>

      {gyms.length > 0 && (
        <div className="space-y-2">
          {gyms.map((g) => (
            <Card key={g.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{g.name}</span>
                </div>
                {g.alreadyLinked ? (
                  <span className="text-xs text-muted-foreground">Already your gym</span>
                ) : g.requestPending ? (
                  <span className="text-xs text-muted-foreground">Request pending</span>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setSelected(g)}>
                    Request to join
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Request to join {selected.name}</CardTitle>
            <CardDescription>They&apos;ll see this info when reviewing your request</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName" required value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName" required value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone" value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message">Message (optional)</Label>
                <Input
                  id="message" value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Sending…" : "Send request"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setSelected(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
