import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import {
  Users, ClipboardCheck, TrendingUp, AlertCircle,
  CalendarCheck, Clock, ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { StatCard } from "@/components/stat-card"
import { ScanWidget } from "@/components/scan-widget"

function formatDate(d: Date) {
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
}
function daysLeft(end: Date) {
  return Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}
function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`
}
function trendPct(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const tenantId = session.tenantId
  const now      = new Date()

  const todayStart    = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const todayEnd      = new Date(now); todayEnd.setHours(23, 59, 59, 999)
  const sevenDays     = new Date(now); sevenDays.setDate(sevenDays.getDate() + 7)
  const monthStart    = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart= new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd  = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
  const yesterday     = new Date(todayStart); yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayEnd  = new Date(todayStart); yesterdayEnd.setMilliseconds(-1)

  const [
    activeMembers,
    lastMonthMembers,
    checkinToday,
    checkinYesterday,
    monthRevResult,
    lastMonthRevResult,
    outstandingCount,
    expiringMemberships,
    todayBookings,
  ] = await Promise.all([
    prisma.member.count({ where: { tenantId, status: "ACTIVE" } }),
    prisma.member.count({ where: { tenantId, status: "ACTIVE", joinDate: { lt: monthStart } } }),
    prisma.attendance.count({ where: { tenantId, checkedInAt: { gte: todayStart } } }),
    prisma.attendance.count({ where: { tenantId, checkedInAt: { gte: yesterday, lte: yesterdayEnd } } }),
    prisma.invoice.aggregate({ where: { tenantId, paymentStatus: "PAID", paidAt: { gte: monthStart } }, _sum: { total: true } }),
    prisma.invoice.aggregate({ where: { tenantId, paymentStatus: "PAID", paidAt: { gte: lastMonthStart, lte: lastMonthEnd } }, _sum: { total: true } }),
    prisma.invoice.count({ where: { tenantId, paymentStatus: "PENDING" } }),
    prisma.membership.findMany({
      where: { status: "ACTIVE", endDate: { gte: now, lte: sevenDays }, member: { tenantId } },
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
        plan:   { select: { name: true } },
      },
      orderBy: { endDate: "asc" },
      take: 8,
    }),
    session.moduleCourts
      ? prisma.slotBooking.findMany({
          where: { tenantId, bookingDate: { gte: todayStart, lte: todayEnd }, status: "CONFIRMED" },
          include: {
            court:  { select: { name: true, sport: true } },
            member: { select: { firstName: true, lastName: true } },
          },
          orderBy: [{ courtId: "asc" }, { startTime: "asc" }],
          take: 10,
        })
      : Promise.resolve([]),
  ])

  const monthlyRevenue  = Number(monthRevResult._sum.total ?? 0)
  const lastMonthRevenue= Number(lastMonthRevResult._sum.total ?? 0)

  const canSeeRevenue  = ["OWNER", "ADMIN", "MANAGER"].includes(session.role)
  const canSeeBookings = session.moduleCourts && ["OWNER", "ADMIN", "MANAGER", "STAFF"].includes(session.role)

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Welcome back, {session.firstName}.
          </p>
        </div>
        <kbd className="hidden items-center gap-1 rounded border border-border bg-white px-2 py-1 text-xs text-muted-foreground shadow-sm sm:flex">
          <span className="text-sm">⌘</span>K
          <span className="ml-1 text-muted-foreground/60">to search</span>
        </kbd>
      </div>

      {/* Stat cards with animated counters */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active Members"
          value={activeMembers}
          sub="current members"
          icon={<Users className="h-4 w-4 text-primary" />}
          iconColor="bg-primary/10"
          trend={{ pct: trendPct(activeMembers, lastMonthMembers), label: "vs last month" }}
        />

        {session.moduleGym && (
          <StatCard
            label="Check-ins Today"
            value={checkinToday}
            sub="since midnight"
            icon={<ClipboardCheck className="h-4 w-4 text-amber-600" />}
            iconColor="bg-amber-50"
            trend={{ pct: trendPct(checkinToday, checkinYesterday), label: "vs yesterday" }}
          />
        )}

        {canSeeRevenue && (
          <StatCard
            label="Monthly Revenue"
            value={monthlyRevenue}
            prefix="PKR"
            sub="collected this month"
            icon={<TrendingUp className="h-4 w-4 text-purple-600" />}
            iconColor="bg-purple-50"
            trend={{ pct: trendPct(monthlyRevenue, lastMonthRevenue), label: "vs last month" }}
            format="currency"
          />
        )}

        {canSeeRevenue && (
          <StatCard
            label="Outstanding"
            value={outstandingCount}
            sub="unpaid invoices"
            icon={<AlertCircle className={`h-4 w-4 ${outstandingCount > 0 ? "text-red-500" : "text-muted-foreground"}`} />}
            iconColor={outstandingCount > 0 ? "bg-red-50" : "bg-muted"}
          />
        )}
      </div>

      {/* Scan check-in/out — kept open at reception all day */}
      {session.moduleGym && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Scan Check-in / Check-out</h2>
          <ScanWidget compact />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Expiring memberships */}
        {session.moduleGym && (
          <div className="rounded-xl border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Expiring This Week</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Memberships ending in 7 days</p>
              </div>
              {expiringMemberships.length > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  {expiringMemberships.length}
                </span>
              )}
            </div>
            {expiringMemberships.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-muted-foreground">No memberships expiring in the next 7 days.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {expiringMemberships.map((m) => {
                  const days = daysLeft(m.endDate)
                  return (
                    <li key={m.id}>
                      <Link
                        href={`/dashboard/members/${m.memberId}`}
                        className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-muted/30"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {m.member.firstName} {m.member.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{m.plan.name} · Expires {formatDate(m.endDate)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            days <= 1 ? "bg-red-100 text-red-700" :
                            days <= 3 ? "bg-orange-100 text-orange-700" :
                            "bg-amber-100 text-amber-700"
                          }`}>
                            {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days}d left`}
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        {/* Today's court bookings */}
        {canSeeBookings && (
          <div className="rounded-xl border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Today&apos;s Court Bookings</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {todayBookings.length} confirmed slot{todayBookings.length !== 1 ? "s" : ""} today
                </p>
              </div>
              <Link href="/dashboard/bookings" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            {todayBookings.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <CalendarCheck className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No bookings confirmed for today.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {todayBookings.map((b) => {
                  const name = b.member
                    ? `${b.member.firstName} ${b.member.lastName}`
                    : (b as unknown as { customerName?: string }).customerName || "Walk-in"
                  return (
                    <li key={b.id} className="flex items-center justify-between px-6 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {b.court.name}{b.court.sport ? ` · ${b.court.sport}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(b.startTime)} – {formatTime(b.endTime)}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        {/* Quick actions */}
        <div className="rounded-xl border border-border bg-white shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
          </div>
          <div className="divide-y divide-border">
            {[
              session.moduleGym && ["OWNER","ADMIN","MANAGER","STAFF"].includes(session.role) &&
                { label: "Add new member",    href: "/dashboard/members/new" },
              session.moduleGym && ["OWNER","ADMIN","MANAGER","STAFF","TRAINER"].includes(session.role) &&
                { label: "Record attendance", href: "/dashboard/attendance" },
              session.moduleGym && ["OWNER","ADMIN","MANAGER","STAFF"].includes(session.role) &&
                { label: "View billing",      href: "/dashboard/billing" },
              session.moduleCourts && ["OWNER","ADMIN","MANAGER","STAFF"].includes(session.role) &&
                { label: "Court bookings",    href: "/dashboard/bookings" },
              ["OWNER","ADMIN"].includes(session.role) &&
                { label: "Reports",           href: "/dashboard/reports" },
              ["OWNER","ADMIN"].includes(session.role) &&
                { label: "General settings",  href: "/dashboard/settings/general" },
            ]
              .filter(Boolean)
              .map((item) => {
                const { label, href } = item as { label: string; href: string }
                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center justify-between px-6 py-3 text-sm text-foreground transition-colors hover:bg-muted/40"
                  >
                    {label}
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}
