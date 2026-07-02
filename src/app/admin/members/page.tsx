import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users } from "lucide-react"

type SearchParams = { q?: string; status?: string; tenantId?: string }

const statusColors: Record<string, "success" | "secondary" | "warning" | "destructive"> = {
  ACTIVE: "success", INACTIVE: "secondary", EXPIRED: "warning", SUSPENDED: "destructive",
}

const STATUS_FILTERS = ["ACTIVE", "INACTIVE", "EXPIRED", "SUSPENDED"]

export default async function AdminMembersPage({ searchParams }: { searchParams: SearchParams }) {
  const { q, status, tenantId } = searchParams

  const where: Record<string, unknown> = {}
  if (tenantId) where.tenantId = tenantId
  if (status) where.status = status
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { consumerNumber: { contains: q, mode: "insensitive" } },
    ]
  }

  const [members, tenants, totalCount] = await Promise.all([
    prisma.member.findMany({
      where,
      orderBy: [{ tenant: { name: "asc" } }, { firstName: "asc" }],
      take: 200,
      include: {
        tenant: { select: { id: true, name: true, kuickpayInstitutionId: true } },
        memberships: {
          where: { status: "ACTIVE" },
          include: { plan: { select: { name: true } } },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.tenant.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.member.count(),
  ])

  const isFiltered = !!(q || status || tenantId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">All Members</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isFiltered ? `${members.length} matching` : `${totalCount} total`} member{totalCount !== 1 ? "s" : ""} across all gyms
          </p>
        </div>

        {/* Global search */}
        <form method="GET" className="flex items-center gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search name, email, phone…"
            className="h-9 w-64 rounded-md border border-border bg-white px-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {status && <input type="hidden" name="status" value={status} />}
          {tenantId && <input type="hidden" name="tenantId" value={tenantId} />}
          <button
            type="submit"
            className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90"
          >
            Search
          </button>
          {isFiltered && (
            <Link
              href="/admin/members"
              className="h-9 flex items-center rounded-md border border-border bg-white px-3 text-sm text-muted-foreground hover:bg-muted/40"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2">
        {/* Status pills */}
        <div className="flex gap-1.5">
          <Link
            href={`/admin/members${q ? `?q=${q}` : ""}${tenantId ? `${q ? "&" : "?"}tenantId=${tenantId}` : ""}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !status ? "bg-primary text-white" : "border border-border bg-white text-foreground hover:bg-muted/40"
            }`}
          >
            All Status
          </Link>
          {STATUS_FILTERS.map((s) => {
            const params = new URLSearchParams()
            if (q) params.set("q", q)
            if (tenantId) params.set("tenantId", tenantId)
            params.set("status", s)
            return (
              <Link
                key={s}
                href={`/admin/members?${params}`}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  status === s ? "bg-primary text-white" : "border border-border bg-white text-foreground hover:bg-muted/40"
                }`}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </Link>
            )
          })}
        </div>

        {/* Gym filter */}
        {tenants.length > 1 && (
          <div className="ml-2 flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Gym:</span>
            <Link
              href={`/admin/members${q ? `?q=${q}` : ""}${status ? `${q ? "&" : "?"}status=${status}` : ""}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !tenantId ? "bg-primary text-white" : "border border-border bg-white text-foreground hover:bg-muted/40"
              }`}
            >
              All Gyms
            </Link>
            {tenants.map((t) => {
              const params = new URLSearchParams()
              if (q) params.set("q", q)
              if (status) params.set("status", status)
              params.set("tenantId", t.id)
              return (
                <Link
                  key={t.id}
                  href={`/admin/members?${params}`}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    tenantId === t.id ? "bg-primary text-white" : "border border-border bg-white text-foreground hover:bg-muted/40"
                  }`}
                >
                  {t.name}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-white shadow-sm">
        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {isFiltered ? "No members match your filters." : "No members yet."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Gym</TableHead>
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
                  <TableCell>
                    <Link
                      href={`/admin/tenants/${m.tenant.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {m.tenant.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{m.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.phone ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {m.tenant.kuickpayInstitutionId && m.consumerNumber
                      ? `${m.tenant.kuickpayInstitutionId}-${m.consumerNumber}`
                      : (m.consumerNumber ?? "—")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {m.memberships[0]?.plan.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[m.status] ?? "secondary"}>
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

      {members.length === 200 && (
        <p className="text-center text-xs text-muted-foreground">
          Showing first 200 results. Use search or gym filters to narrow down.
        </p>
      )}
    </div>
  )
}
