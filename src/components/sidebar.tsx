"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ClipboardList,
  Calendar,
  UserCog,
  BarChart3,
  Receipt,
  MapPin,
  Dumbbell,
  Sparkles,
  Zap,
  Grid3x3,
  CalendarCheck,
  Settings,
  FileSpreadsheet,
  type LucideIcon,
} from "lucide-react"

type Role = string

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
  roles?: Role[]         // roles that can see this item; omit = all roles
  module?: "gym" | "courts" // module that must be enabled; omit = always shown
}

type NavGroup = {
  label: string
  items: NavItem[]
  module?: "gym" | "courts" // hide whole group when module disabled
}

// ─── NAVIGATION DEFINITION ───────────────────────────────────────────────────
//
// Role access levels (descending privilege):
//   OWNER > ADMIN > MANAGER > STAFF > TRAINER
//
// Module "gym"    → Members, Plans, Billing, Attendance, Trainers, Classes
// Module "courts" → Courts management, Bookings
//
const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Gym Management",
    module: "gym",
    items: [
      { href: "/dashboard/members",    label: "Members",    icon: Users,        roles: ["OWNER","ADMIN","MANAGER","STAFF","TRAINER"] },
      { href: "/dashboard/branches",   label: "Branches",   icon: MapPin,       roles: ["OWNER","ADMIN","MANAGER"] },
      { href: "/dashboard/trainers",   label: "Trainers",   icon: Dumbbell,     roles: ["OWNER","ADMIN","MANAGER"] },
      { href: "/dashboard/plans",      label: "Plans",      icon: CreditCard,   roles: ["OWNER","ADMIN","MANAGER"] },
      { href: "/dashboard/billing",    label: "Billing",    icon: Receipt,      roles: ["OWNER","ADMIN","MANAGER","STAFF"] },
      { href: "/dashboard/attendance", label: "Attendance", icon: ClipboardList,roles: ["OWNER","ADMIN","MANAGER","STAFF","TRAINER"] },
      { href: "/dashboard/classes",    label: "Classes",    icon: Calendar,     roles: ["OWNER","ADMIN","MANAGER","STAFF","TRAINER"] },
    ],
  },
  {
    label: "Court Management",
    module: "courts",
    items: [
      { href: "/dashboard/courts",   label: "Courts",   icon: Grid3x3,    roles: ["OWNER","ADMIN","MANAGER"] },
      { href: "/dashboard/bookings", label: "Bookings", icon: CalendarCheck, roles: ["OWNER","ADMIN","MANAGER","STAFF"] },
    ],
  },
  // When only courts module is active (no gym), Members + Billing still needed
  {
    label: "Members",
    items: [
      { href: "/dashboard/members", label: "Members", icon: Users,   roles: ["OWNER","ADMIN","MANAGER","STAFF","TRAINER"], module: undefined },
      { href: "/dashboard/billing", label: "Billing", icon: Receipt, roles: ["OWNER","ADMIN","MANAGER","STAFF"],           module: undefined },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/dashboard/staff",           label: "Staff",            icon: UserCog,        roles: ["OWNER","ADMIN"] },
      { href: "/dashboard/reports",         label: "Reports",          icon: BarChart3,      roles: ["OWNER","ADMIN","MANAGER"] },
      { href: "/dashboard/reports/payments", label: "Payment Reports", icon: FileSpreadsheet, roles: ["OWNER","ADMIN","MANAGER"] },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/dashboard/settings/general",    label: "General",      icon: Settings, roles: ["OWNER","ADMIN"] },
      { href: "/dashboard/settings/facilities", label: "Facilities",   icon: Sparkles, roles: ["OWNER","ADMIN"], module: "gym" },
      { href: "/dashboard/settings/kuickpay",   label: "Kuickpay BPS", icon: Zap,      roles: ["OWNER","ADMIN"] },
    ],
  },
]

type Props = {
  role: string
  moduleGym: boolean
  moduleCourts: boolean
}

export function Sidebar({ role, moduleGym, moduleCourts }: Props) {
  const pathname = usePathname()

  function moduleEnabled(mod?: "gym" | "courts"): boolean {
    if (!mod) return true
    return mod === "gym" ? moduleGym : moduleCourts
  }

  function roleAllowed(roles?: Role[]): boolean {
    if (!roles || roles.length === 0) return true
    return roles.includes(role)
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + "/")
  }

  // Which nav groups to render — deduplicate Members/Billing between gym and courts-only
  const rendered = navGroups.filter((group) => {
    if (!moduleEnabled(group.module)) return false
    // "Members" catch-all group only shows when gym module is OFF (gym group already covers it)
    if (group.label === "Members" && moduleGym) return false
    return true
  })

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-white">
      <nav className="flex-1 overflow-y-auto py-4">
        {rendered.map((group) => {
          const visibleItems = group.items.filter(
            (item) => roleAllowed(item.roles) && moduleEnabled(item.module)
          )
          if (visibleItems.length === 0) return null

          return (
            <div key={group.label} className="mb-5">
              <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {group.label}
              </p>
              <ul>
                {visibleItems.map(({ href, label, icon: Icon, exact }) => {
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
          )
        })}
      </nav>

      <div className="border-t border-border px-4 py-3">
        <p className="text-[11px] text-muted-foreground">Club Manager 360 v1.0 · 2026</p>
      </div>
    </aside>
  )
}
