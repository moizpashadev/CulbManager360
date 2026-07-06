"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Building2, LayoutDashboard, Users, CreditCard, type LucideIcon } from "lucide-react"

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean; mobilePriority?: number }
type NavGroup = { label: string; items: NavItem[] }

const navGroups: NavGroup[] = [
  {
    label: "Platform",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true, mobilePriority: 1 },
      { href: "/admin/tenants", label: "Gyms & Clubs", icon: Building2, mobilePriority: 2 },
      { href: "/admin/members", label: "All Members", icon: Users, mobilePriority: 3 },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/admin/plans", label: "Subscription Plans", icon: CreditCard },
      { href: "/admin/billing", label: "Billing", icon: CreditCard, mobilePriority: 4 },
    ],
  },
  {
    label: "Accounts",
    items: [
      { href: "/admin/admins", label: "Super Admins", icon: Users },
    ],
  },
]

export const adminNavGroups = navGroups

export function getAdminMobilePrimaryItems(): NavItem[] {
  const items = navGroups.flatMap((g) => g.items).filter((i) => i.mobilePriority != null)
  return items.sort((a, b) => (a.mobilePriority ?? 99) - (b.mobilePriority ?? 99)).slice(0, 4)
}

export function AdminSidebar() {
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-border bg-white md:flex">
      <div className="border-b border-border px-4 py-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Admin Console
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group.label}
            </p>
            <ul>
              {group.items.map(({ href, label, icon: Icon, exact }) => {
                const active = isActive(href, exact)
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-3 border-l-2 px-4 py-2 text-sm transition-colors",
                        active
                          ? "border-primary bg-secondary text-primary font-medium"
                          : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-border px-4 py-3">
        <p className="text-[11px] text-muted-foreground">Club Manager 360 v1.0 · 2026</p>
      </div>
    </aside>
  )
}
