import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { Building2, Users, ArrowRight, UserCog } from "lucide-react"

async function getStats() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const in30Days = new Date(now)
  in30Days.setDate(in30Days.getDate() + 30)

  const [tenantCount, memberCount, activeCount, revenueThisMonth, subStats, billingDue] = await Promise.all([
    prisma.tenant.count({ where: { isActive: true } }),
    prisma.member.count(),
    prisma.member.count({ where: { status: "ACTIVE" } }),
    prisma.invoice.aggregate({
      where: { paymentStatus: "PAID", createdAt: { gte: monthStart } },
      _sum: { total: true },
    }),
    prisma.tenant.groupBy({
      by: ["subscriptionStatus"],
      _count: true,
    }),
    prisma.tenant.findMany({
      where: {
        subscriptionStatus: "ACTIVE",
        nextBillingDate: { lte: in30Days, gte: now },
      },
      select: { id: true, name: true, nextBillingDate: true, platformPlan: { select: { name: true, monthlyPrice: true } } },
      orderBy: { nextBillingDate: "asc" },
    }),
  ])
  return {
    tenantCount,
    memberCount,
    activeCount,
    revenueThisMonth: Number(revenueThisMonth._sum.total ?? 0),
    subStats,
    billingDue,
  }
}

const SUB_COLORS: Record<string, string> = {
  TRIAL:     "bg-blue-50 text-blue-700",
  ACTIVE:    "bg-green-50 text-green-700",
  PAST_DUE:  "bg-amber-50 text-amber-700",
  SUSPENDED: "bg-red-50 text-red-700",
  CANCELLED: "bg-gray-50 text-gray-600",
}

export default async function AdminPage() {
  const { tenantCount, memberCount, activeCount, revenueThisMonth, subStats, billingDue } = await getStats()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Platform Overview</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage all gyms and clubs on the Club Manager 360 platform
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Active Gyms", value: tenantCount, icon: Building2 },
          { label: "Total Members", value: memberCount, icon: Users },
          { label: "Active Members", value: activeCount, icon: Users },
          { label: "Revenue This Month", value: `PKR ${revenueThisMonth.toLocaleString("en-PK")}`, icon: UserCog, mono: true },
        ].map(({ label, value, icon: Icon, mono }) => (
          <div key={label} className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className={`mt-3 font-semibold tabular-nums text-foreground ${mono ? "text-lg font-mono text-primary" : "text-3xl"}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Subscription breakdown + upcoming billing */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-8">
        <div className="rounded-lg border border-border bg-white shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-medium text-foreground">Subscription Status</h2>
          </div>
          <div className="divide-y divide-border">
            {subStats.length === 0 ? (
              <p className="px-6 py-6 text-sm text-muted-foreground">No subscriptions yet.</p>
            ) : subStats.map((s) => (
              <div key={s.subscriptionStatus} className="flex items-center justify-between px-6 py-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${SUB_COLORS[s.subscriptionStatus] ?? ""}`}>
                  {s.subscriptionStatus}
                </span>
                <span className="text-sm font-semibold tabular-nums text-foreground">{s._count} gym{s._count !== 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-white shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-medium text-foreground">Billing Due — Next 30 Days</h2>
          </div>
          {billingDue.length === 0 ? (
            <p className="px-6 py-6 text-sm text-muted-foreground">No billing due in the next 30 days.</p>
          ) : (
            <div className="divide-y divide-border">
              {billingDue.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <Link href={`/admin/tenants/${t.id}`} className="text-sm font-medium text-foreground hover:text-primary">
                      {t.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{t.platformPlan?.name}</p>
                  </div>
                  <div className="text-right">
                    {t.platformPlan?.monthlyPrice && (
                      <p className="font-mono text-sm font-semibold text-primary">
                        PKR {Number(t.platformPlan.monthlyPrice).toLocaleString("en-PK")}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t.nextBillingDate ? new Date(t.nextBillingDate).toLocaleDateString("en-PK") : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-lg border border-border bg-white shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-medium text-foreground">Quick Actions</h2>
        </div>
        <div className="divide-y divide-border">
          {[
            { href: "/admin/tenants", icon: Building2, title: "Manage Gyms & Clubs", desc: "View, add, or suspend gym accounts" },
            { href: "/admin/members", icon: Users, title: "All Members", desc: "Browse members across all gyms with search and filters" },
            { href: "/admin/plans", icon: UserCog, title: "Subscription Plans", desc: "Create and manage your Offline, Self-Hosted and SaaS plans" },
            { href: "/admin/tenants/new", icon: Building2, title: "Add New Gym", desc: "Onboard a new gym and create their owner account" },
          ].map(({ href, icon: Icon, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-between px-6 py-4 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
