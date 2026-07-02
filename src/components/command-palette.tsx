"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import {
  Users, CreditCard, LayoutDashboard, Building2, ClipboardCheck,
  BarChart2, BookOpen, Settings, Grid3x3, CalendarCheck, Search,
  ArrowRight, Dumbbell,
} from "lucide-react"

type Member = { id: string; firstName: string; lastName: string; status: string }

const NAV_ITEMS = [
  { label: "Dashboard",        href: "/dashboard",                    icon: LayoutDashboard },
  { label: "Members",          href: "/dashboard/members",            icon: Users },
  { label: "Add New Member",   href: "/dashboard/members/new",        icon: Users },
  { label: "Billing",          href: "/dashboard/billing",            icon: CreditCard },
  { label: "Attendance",       href: "/dashboard/attendance",         icon: ClipboardCheck },
  { label: "Plans",            href: "/dashboard/plans",              icon: Dumbbell },
  { label: "Classes",          href: "/dashboard/classes",            icon: BookOpen },
  { label: "Court Bookings",   href: "/dashboard/bookings",           icon: Grid3x3 },
  { label: "Courts",           href: "/dashboard/courts",             icon: CalendarCheck },
  { label: "Reports",          href: "/dashboard/reports",            icon: BarChart2 },
  { label: "Payment Reports",  href: "/dashboard/reports/payments",   icon: CreditCard },
  { label: "Branches",         href: "/dashboard/branches",           icon: Building2 },
  { label: "Settings",         href: "/dashboard/settings/general",   icon: Settings },
]

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)

  // Open on Ctrl+K / Cmd+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  // Search members
  useEffect(() => {
    if (!open || query.length < 2) { setMembers([]); return }
    setLoading(true)
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setMembers(data.members ?? [])
      } finally {
        setLoading(false)
      }
    }, 200)
    return () => clearTimeout(timeout)
  }, [query, open])

  const navigate = useCallback((href: string) => {
    setOpen(false)
    setQuery("")
    router.push(href)
  }, [router])

  const filteredNav = query.length < 1
    ? NAV_ITEMS.slice(0, 6)
    : NAV_ITEMS.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      )

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command shouldFilter={false}>
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search members, navigate pages…"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              autoFocus
            />
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              {loading ? "Searching…" : `No results for "${query}"`}
            </Command.Empty>

            {/* Members */}
            {members.length > 0 && (
              <Command.Group heading="Members" className="mb-1">
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Members</p>
                {members.map((m) => (
                  <Command.Item
                    key={m.id}
                    value={`member-${m.id}`}
                    onSelect={() => navigate(`/dashboard/members/${m.id}`)}
                    className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted/60 data-[selected=true]:bg-muted/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        {m.firstName[0]}{m.lastName[0]}
                      </div>
                      <span>{m.firstName} {m.lastName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        m.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-muted text-muted-foreground"
                      }`}>{m.status}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Navigation */}
            {filteredNav.length > 0 && (
              <Command.Group>
                <p className="mb-1 mt-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {query ? "Pages" : "Quick Navigation"}
                </p>
                {filteredNav.map((item) => {
                  const Icon = item.icon
                  return (
                    <Command.Item
                      key={item.href}
                      value={item.label}
                      onSelect={() => navigate(item.href)}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted/60 data-[selected=true]:bg-muted/60"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-muted">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      {item.label}
                      <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground" />
                    </Command.Item>
                  )
                })}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border px-4 py-2">
            <p className="text-[11px] text-muted-foreground">
              Type a name to search members · navigate with arrows · enter to open
            </p>
            <div className="flex gap-1">
              {[["↑↓", "navigate"], ["↵", "open"]].map(([key, hint]) => (
                <span key={key} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">{key}</kbd>
                  {hint}
                </span>
              ))}
            </div>
          </div>
        </Command>
      </div>
    </div>
  )
}
