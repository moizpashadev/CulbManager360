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

export type Role = string

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
  roles?: Role[]         // roles that can see this item; omit = all roles
  module?: "gym" | "courts" // module that must be enabled; omit = always shown
  mobilePriority?: number  // lower = shown in the mobile bottom tab bar; omit = "More" sheet only
}

export type NavGroup = {
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
export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true, mobilePriority: 1 },
    ],
  },
  {
    label: "Gym Management",
    module: "gym",
    items: [
      { href: "/dashboard/members",    label: "Members",    icon: Users,        roles: ["OWNER","ADMIN","MANAGER","STAFF","TRAINER"], mobilePriority: 2 },
      { href: "/dashboard/branches",   label: "Branches",   icon: MapPin,       roles: ["OWNER","ADMIN","MANAGER"] },
      { href: "/dashboard/trainers",   label: "Trainers",   icon: Dumbbell,     roles: ["OWNER","ADMIN","MANAGER"] },
      { href: "/dashboard/plans",      label: "Plans",      icon: CreditCard,   roles: ["OWNER","ADMIN","MANAGER"] },
      { href: "/dashboard/billing",    label: "Billing",    icon: Receipt,      roles: ["OWNER","ADMIN","MANAGER","STAFF"], mobilePriority: 4 },
      { href: "/dashboard/attendance", label: "Attendance", icon: ClipboardList,roles: ["OWNER","ADMIN","MANAGER","STAFF","TRAINER"], mobilePriority: 3 },
      { href: "/dashboard/classes",    label: "Classes",    icon: Calendar,     roles: ["OWNER","ADMIN","MANAGER","STAFF","TRAINER"] },
    ],
  },
  {
    label: "Court Management",
    module: "courts",
    items: [
      { href: "/dashboard/courts",   label: "Courts",   icon: Grid3x3,    roles: ["OWNER","ADMIN","MANAGER"] },
      { href: "/dashboard/bookings", label: "Bookings", icon: CalendarCheck, roles: ["OWNER","ADMIN","MANAGER","STAFF"], mobilePriority: 3 },
    ],
  },
  // When only courts module is active (no gym), Members + Billing still needed
  {
    label: "Members",
    items: [
      { href: "/dashboard/members", label: "Members", icon: Users,   roles: ["OWNER","ADMIN","MANAGER","STAFF","TRAINER"], module: undefined, mobilePriority: 2 },
      { href: "/dashboard/billing", label: "Billing", icon: Receipt, roles: ["OWNER","ADMIN","MANAGER","STAFF"],           module: undefined, mobilePriority: 4 },
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

export function moduleEnabled(mod: "gym" | "courts" | undefined, moduleGym: boolean, moduleCourts: boolean): boolean {
  if (!mod) return true
  return mod === "gym" ? moduleGym : moduleCourts
}

export function roleAllowed(role: Role, roles?: Role[]): boolean {
  if (!roles || roles.length === 0) return true
  return roles.includes(role)
}

export function getVisibleGroups(role: Role, moduleGym: boolean, moduleCourts: boolean): NavGroup[] {
  return navGroups
    .filter((group) => {
      if (!moduleEnabled(group.module, moduleGym, moduleCourts)) return false
      // "Members" catch-all group only shows when gym module is OFF (gym group already covers it)
      if (group.label === "Members" && moduleGym) return false
      return true
    })
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => roleAllowed(role, item.roles) && moduleEnabled(item.module, moduleGym, moduleCourts)
      ),
    }))
    .filter((group) => group.items.length > 0)
}

export function getMobilePrimaryItems(role: Role, moduleGym: boolean, moduleCourts: boolean): NavItem[] {
  const groups = getVisibleGroups(role, moduleGym, moduleCourts)
  const items = groups.flatMap((g) => g.items).filter((i) => i.mobilePriority != null)
  return items.sort((a, b) => (a.mobilePriority ?? 99) - (b.mobilePriority ?? 99)).slice(0, 4)
}
