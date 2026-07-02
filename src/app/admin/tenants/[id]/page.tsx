import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Building2, Users, UserCog, CreditCard, MapPin } from "lucide-react"
import { SubscriptionForm } from "./subscription-form"

type Props = { params: { id: string }; searchParams: { q?: string; status?: string } }

function fmt(n: unknown) {
  return `PKR ${Number(n).toLocaleString("en-PK")}`
}

const memberStatusColors: Record<string, "success" | "secondary" | "warning" | "destructive"> = {
  ACTIVE: "success", INACTIVE: "secondary", EXPIRED: "warning", SUSPENDED: "destructive",
}

export default async function AdminTenantDetailPage({ params, searchParams }: Props) {
  const { q, status } = searchParams

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [tenant, allPlans] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: params.id },
      include: {
        branches: { orderBy: { name: "asc" }, select: { id: true, name: true, isActive: true } },
        _count: { select: { members: true, staff: true, branches: true } },
        platformPlan: true,
      },
    }),
    prisma.platformPlan.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ])
  if (!tenant) notFound()

  // Member filters
  const memberWhere: Record<string, unknown> = { tenantId: params.id }
  if (q) {
    memberWhere.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { consumerNumber: { contains: q, mode: "insensitive" } },
    ]
  }
  if (status) memberWhere.status = status

  const [members, revenue, staffList] = await Promise.all([
    prisma.member.findMany({
      where: memberWhere,
      orderBy: [{ status: "asc" }, { firstName: "asc" }],
      include: {
        memberships: {
          where: { status: "ACTIVE" },
          include: { plan: { select: { name: true } } },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.invoice.aggregate({
      where: { tenantId: params.id, paymentStatus: "PAID", createdAt: { gte: monthStart } },
      _sum: { total: true },
    }),
    prisma.staff.findMany({
      where: { tenantId: params.id },
      orderBy: [{ role: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true },
    }),
  ])

  const activeMembers = members.filter((m) => m.status === "ACTIVE").length
  const revenueThisMonth = Number(revenue._sum.total ?? 0)

  const STATUS_FILTERS = ["ACTIVE", "INACTIVE", "EXPIRED", "SUSPENDED"]

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/tenants">
          <button className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div className="flex flex-1 items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{tenant.name}</h1>
            <div className="mt-0.5 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-mono">/{tenant.slug}</span>
              {tenant.contactEmail && <span>{tenant.contactEmail}</span>}
            </div>
          </div>
          <Badge variant={tenant.isActive ? "success" : "secondary"}>
            {tenant.isActive ? "Active" : "Suspended"}
          </Badge>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: "Total Members", value: tenant._count.members, icon: Users },
          { label: "Active Members", value: activeMembers, icon: Users },
          { label: "Staff", value: tenant._count.staff, icon: UserCog },
          { label: "Branches", value: tenant._count.branches, icon: MapPin },
          { label: "Revenue This Month", value: fmt(revenueThisMonth), icon: CreditCard, mono: true },
        ].map(({ label, value, icon: Icon, mono }) => (
          <div key={label} className="rounded-lg border border-border bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className={`mt-2 font-bold text-foreground ${mono ? "text-sm font-mono text-primary" : "text-2xl tabular-nums"}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Members section */}
      <div className="rounded-lg border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Members</h2>
            <p className="text-xs text-muted-foreground">
              {members.length}{q || status ? " matching" : ""} member{members.length !== 1 ? "s" : ""}
              {q ? ` for "${q}"` : ""}
            </p>
          </div>
          {/* Search */}
          <form method="GET" className="flex items-center gap-2">
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search by name, email, phone…"
              className="h-8 w-56 rounded-md border border-border bg-white px-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {status && <input type="hidden" name="status" value={status} />}
            <button
              type="submit"
              className="h-8 rounded-md bg-primary px-3 text-xs font-medium text-white hover:bg-primary/90"
            >
              Search
            </button>
            {(q || status) && (
              <Link
                href={`/admin/tenants/${params.id}`}
                className="h-8 flex items-center rounded-md border border-border bg-white px-3 text-xs text-muted-foreground hover:bg-muted/40"
              >
                Clear
              </Link>
            )}
          </form>
        </div>

        {/* Status filters */}
        <div className="flex gap-2 border-b border-border px-6 py-3">
          <Link
            href={q ? `/admin/tenants/${params.id}?q=${q}` : `/admin/tenants/${params.id}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !status ? "bg-primary text-white" : "border border-border bg-white text-foreground hover:bg-muted/40"
            }`}
          >
            All
          </Link>
          {STATUS_FILTERS.map((s) => {
            const href = q ? `/admin/tenants/${params.id}?q=${q}&status=${s}` : `/admin/tenants/${params.id}?status=${s}`
            return (
              <Link
                key={s}
                href={href}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  status === s ? "bg-primary text-white" : "border border-border bg-white text-foreground hover:bg-muted/40"
                }`}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </Link>
            )
          })}
        </div>

        {members.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {q ? `No members match "${q}".` : "No members yet."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Consumer #</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">
                    {m.firstName} {m.lastName}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{m.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.phone ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {tenant.kuickpayInstitutionId && m.consumerNumber
                      ? `${tenant.kuickpayInstitutionId}-${m.consumerNumber}`
                      : (m.consumerNumber ?? "—")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {m.memberships[0]?.plan.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={memberStatusColors[m.status] ?? "secondary"}>
                      {m.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(m.createdAt).toLocaleDateString("en-PK")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Subscription card */}
      <SubscriptionForm
        tenantId={params.id}
        plans={allPlans}
        current={{
          platformPlanId: tenant.platformPlanId,
          subscriptionStatus: tenant.subscriptionStatus,
          subscriptionStart: tenant.subscriptionStart?.toISOString() ?? null,
          nextBillingDate: tenant.nextBillingDate?.toISOString() ?? null,
          subscriptionNotes: tenant.subscriptionNotes,
        }}
      />

      {/* Staff + Branches in a 2-col grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Staff */}
        <div className="rounded-lg border border-border bg-white shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold text-foreground">Staff ({staffList.length})</h2>
          </div>
          {staffList.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">No staff yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {staffList.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.firstName} {s.lastName}</p>
                    <p className="font-mono text-xs text-muted-foreground">{s.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{s.role}</Badge>
                    {!s.isActive && <Badge variant="secondary">Inactive</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Branches */}
        <div className="rounded-lg border border-border bg-white shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold text-foreground">Branches ({tenant.branches.length})</h2>
          </div>
          {tenant.branches.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">No branches yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {tenant.branches.map((b) => (
                <div key={b.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{b.name}</span>
                  </div>
                  <Badge variant={b.isActive ? "success" : "secondary"}>
                    {b.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
