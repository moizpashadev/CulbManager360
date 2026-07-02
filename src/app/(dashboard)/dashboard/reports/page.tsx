import { redirect } from "next/navigation"
import { Suspense } from "react"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { DateRangePicker } from "./date-range-picker"
import { RevenueChart } from "@/components/charts/revenue-chart"
import { AttendanceChart } from "@/components/charts/attendance-chart"

async function getReportData(tenantId: string, rangeStart: Date, rangeEnd: Date, expiryDays = 30) {
  const now = new Date()
  const inNDays = new Date(now); inNDays.setDate(inNDays.getDate() + expiryDays)

  const days14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now); d.setDate(d.getDate() - (13 - i)); d.setHours(0, 0, 0, 0)
    return d
  })

  const months6 = Array.from({ length: 6 }, (_, i) =>
    new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
  )
  const sixMonthsAgo = months6[0]

  const [
    totalMembers, activeMembers, inactiveMembers, suspendedMembers,
    totalPlans, activeMemberships,
    paidInRange, expiringMemberships, planPopularity, rawAttendance,
    monthlyRevRaw,
  ] = await Promise.all([
    prisma.member.count({ where: { tenantId } }),
    prisma.member.count({ where: { tenantId, status: "ACTIVE" } }),
    prisma.member.count({ where: { tenantId, status: "INACTIVE" } }),
    prisma.member.count({ where: { tenantId, status: "SUSPENDED" } }),
    prisma.membershipPlan.count({ where: { tenantId, isActive: true } }),
    prisma.membership.count({ where: { member: { tenantId }, status: "ACTIVE" } }),

    prisma.invoice.aggregate({
      where: { tenantId, paymentStatus: "PAID", createdAt: { gte: rangeStart, lte: rangeEnd } },
      _sum: { total: true },
    }),

    prisma.membership.findMany({
      where: { member: { tenantId }, status: "ACTIVE", endDate: { gte: now, lte: inNDays } },
      include: {
        member: { select: { id: true, firstName: true, lastName: true, email: true } },
        plan:   { select: { name: true } },
      },
      orderBy: { endDate: "asc" },
      take: 10,
    }),

    prisma.membershipPlan.findMany({
      where: { tenantId },
      include: { _count: { select: { memberships: { where: { status: "ACTIVE" } } } } },
      orderBy: { memberships: { _count: "desc" } },
      take: 5,
    }),

    prisma.attendance.findMany({
      where: { tenantId, checkedInAt: { gte: days14[0] } },
      select: { checkedInAt: true },
    }),

    // Single query for 6 months of revenue — grouped in-memory
    prisma.invoice.findMany({
      where: { tenantId, paymentStatus: "PAID", paidAt: { gte: sixMonthsAgo } },
      select: { paidAt: true, total: true },
    }),
  ])

  const attendanceByDay = days14.map((day) => {
    const next = new Date(day); next.setDate(next.getDate() + 1)
    const count = rawAttendance.filter((a) => {
      const d = new Date(a.checkedInAt)
      return d >= day && d < next
    }).length
    return { label: day.toLocaleDateString("en-PK", { weekday: "short", day: "numeric" }), count }
  })

  // Group raw invoices by month in-memory
  const monthlyRevenue = months6.map((monthStart) => {
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999)
    const revenue = monthlyRevRaw
      .filter((inv) => inv.paidAt && inv.paidAt >= monthStart && inv.paidAt <= monthEnd)
      .reduce((sum, inv) => sum + Number(inv.total), 0)
    return { month: monthStart.toLocaleDateString("en-PK", { month: "short" }), revenue }
  })

  return {
    totalMembers, activeMembers, inactiveMembers, suspendedMembers,
    totalPlans, activeMemberships,
    revenueInRange: Number(paidInRange._sum.total ?? 0),
    expiringMemberships, planPopularity,
    attendanceByDay,
    monthlyRevenue,
  }
}

function daysUntil(date: Date | string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; expiry?: string }
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const now = new Date()
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const defaultTo   = now.toISOString().slice(0, 10)
  const fromStr     = searchParams.from   ?? defaultFrom
  const toStr       = searchParams.to     ?? defaultTo
  const expiryDays  = parseInt(searchParams.expiry ?? "30")

  const data = await getReportData(session.tenantId, new Date(fromStr), new Date(toStr + "T23:59:59"), expiryDays)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reports & Analytics</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {new Date(fromStr).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
            {" — "}
            {new Date(toStr).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <Suspense><DateRangePicker from={fromStr} to={toStr} /></Suspense>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Members",      value: data.totalMembers },
          { label: "Active Memberships", value: data.activeMemberships },
          { label: "Revenue",            value: `PKR ${data.revenueInRange.toLocaleString("en-PK")}`, mono: true },
          { label: "Expiring Soon",      value: data.expiringMemberships.length, warn: data.expiringMemberships.length > 0 },
        ].map(({ label, value, mono, warn }) => (
          <div key={label} className={`rounded-xl border bg-white p-5 shadow-sm ${warn ? "border-amber-300" : "border-border"}`}>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className={`mt-3 text-2xl font-semibold ${mono ? "font-mono" : ""} ${warn ? "text-amber-600" : "text-foreground"}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Revenue chart */}
        <div className="rounded-xl border border-border bg-white shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold text-foreground">Revenue — Last 6 Months</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Monthly collected (paid invoices)</p>
          </div>
          <div className="p-5">
            {data.monthlyRevenue.every((d) => d.revenue === 0)
              ? <p className="py-10 text-center text-sm text-muted-foreground">No revenue recorded yet.</p>
              : <RevenueChart data={data.monthlyRevenue} />
            }
          </div>
        </div>

        {/* Attendance chart */}
        <div className="rounded-xl border border-border bg-white shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold text-foreground">Attendance — Last 14 Days</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Daily check-in count</p>
          </div>
          <div className="p-5">
            {data.attendanceByDay.every((d) => d.count === 0)
              ? <p className="py-10 text-center text-sm text-muted-foreground">No attendance recorded yet.</p>
              : <AttendanceChart data={data.attendanceByDay} />
            }
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Expiring memberships */}
        <div className="rounded-xl border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold text-foreground">Expiring Soon</h2>
            <div className="flex gap-1">
              {[7, 14, 30, 60].map((d) => (
                <Link
                  key={d}
                  href={`/dashboard/reports?from=${fromStr}&to=${toStr}&expiry=${d}`}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${
                    expiryDays === d ? "bg-primary text-white" : "border border-border bg-white text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  {d}d
                </Link>
              ))}
            </div>
          </div>
          {data.expiringMemberships.length === 0
            ? <p className="px-6 py-8 text-center text-sm text-muted-foreground">No memberships expiring in the next {expiryDays} days.</p>
            : (
              <ul className="divide-y divide-border">
                {data.expiringMemberships.map((m) => {
                  const days = daysUntil(m.endDate)
                  return (
                    <li key={m.id} className="flex items-center justify-between px-6 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link href={`/dashboard/members/${m.member.id}`} className="text-sm font-medium text-foreground hover:text-primary">
                            {m.member.firstName} {m.member.lastName}
                          </Link>
                          {m.member.email && (
                            <a href={`mailto:${m.member.email}?subject=Membership Renewal Reminder`} className="text-[10px] text-primary hover:underline">
                              Email
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{m.plan.name}</p>
                      </div>
                      <span className={`text-xs font-medium ${days <= 7 ? "text-destructive" : "text-amber-600"}`}>
                        {days === 0 ? "Today" : `${days}d left`}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )
          }
        </div>

        {/* Plan popularity */}
        <div className="rounded-xl border border-border bg-white shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold text-foreground">Plan Popularity</h2>
          </div>
          {data.planPopularity.length === 0
            ? <p className="px-6 py-8 text-center text-sm text-muted-foreground">No plans yet.</p>
            : (
              <div className="divide-y divide-border">
                {data.planPopularity.map((plan, i) => {
                  const max = data.planPopularity[0]._count.memberships || 1
                  return (
                    <div key={plan.id} className="flex items-center gap-4 px-6 py-3">
                      <span className="w-5 text-xs font-semibold text-muted-foreground">#{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">{plan.name}</p>
                          <span className="text-sm font-semibold tabular-nums">{plan._count.memberships}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div className="h-1.5 rounded-full bg-primary" style={{ width: `${(plan._count.memberships / max) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }
        </div>
      </div>

      {/* Member status breakdown */}
      <div className="rounded-xl border border-border bg-white shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Member Status Breakdown</h2>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
          {[
            { label: "Active",    count: data.activeMembers,                                                                               variant: "success"     as const },
            { label: "Inactive",  count: data.inactiveMembers,                                                                             variant: "secondary"   as const },
            { label: "Suspended", count: data.suspendedMembers,                                                                            variant: "destructive" as const },
            { label: "Other",     count: data.totalMembers - data.activeMembers - data.inactiveMembers - data.suspendedMembers,             variant: "warning"     as const },
          ].map(({ label, count, variant }) => (
            <div key={label} className="flex flex-col items-center py-6">
              <p className="text-3xl font-semibold tabular-nums text-foreground">{count}</p>
              <Badge variant={variant} className="mt-2">{label}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
