import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserPlus, Download } from "lucide-react"
import { MembersSearch } from "./members-search"
import { Suspense } from "react"
import { Pagination } from "@/components/pagination"

const PAGE_SIZE = 25

const statusColors: Record<string, "success" | "destructive" | "warning" | "secondary"> = {
  ACTIVE: "success",
  INACTIVE: "secondary",
  SUSPENDED: "destructive",
  EXPIRED: "warning",
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; page?: string }
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const { q, status } = searchParams
  const page = Math.max(1, parseInt(searchParams.page ?? "1"))
  const skip = (page - 1) * PAGE_SIZE

  const where: Record<string, unknown> = { tenantId: session.tenantId }
  if (status) where.status = status
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ]
  }

  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.member.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function buildHref(p: number) {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (status) params.set("status", status)
    if (p > 1) params.set("page", String(p))
    const qs = params.toString()
    return `/dashboard/members${qs ? `?${qs}` : ""}`
  }

  const STATUS_FILTERS = ["ACTIVE", "INACTIVE", "SUSPENDED", "EXPIRED"]
  const exportParams = new URLSearchParams()
  if (q) exportParams.set("q", q)
  if (status) exportParams.set("status", status)
  const exportHref = `/api/members/export${exportParams.toString() ? `?${exportParams}` : ""}`

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Members</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {total} {q || status ? "matching" : "total"} member{total !== 1 ? "s" : ""}
            {q ? ` for "${q}"` : ""}
            {totalPages > 1 && ` · page ${page} of ${totalPages}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Suspense>
            <MembersSearch />
          </Suspense>
          <a
            href={exportHref}
            download
            className="flex h-9 items-center gap-1.5 rounded-md border border-border bg-white px-3 text-sm font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </a>
          <Link href="/dashboard/members/new">
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <Link
          href={q ? `/dashboard/members?q=${q}` : "/dashboard/members"}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !status ? "bg-primary text-white" : "border border-border bg-white text-foreground hover:bg-muted/40"
          }`}
        >
          All
        </Link>
        {STATUS_FILTERS.map((s) => {
          const ps = new URLSearchParams()
          if (q) ps.set("q", q)
          ps.set("status", s)
          return (
            <Link
              key={s}
              href={`/dashboard/members?${ps}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                status === s ? "bg-primary text-white" : "border border-border bg-white text-foreground hover:bg-muted/40"
              }`}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </Link>
          )
        })}
      </div>

      <div className="rounded-lg border border-border bg-white shadow-sm">
        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            {q || status ? (
              <>
                <p className="text-sm text-muted-foreground">No members found for the current filters.</p>
                <Link href="/dashboard/members" className="mt-4">
                  <Button variant="outline" size="sm">Clear filters</Button>
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">No members yet.</p>
                <Link href="/dashboard/members/new" className="mt-4">
                  <Button variant="outline" size="sm">Add your first member</Button>
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Member ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Consumer #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.firstName} {member.lastName}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{member.id}</TableCell>
                    <TableCell className="font-mono text-sm">{member.email}</TableCell>
                    <TableCell>{member.phone ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {member.consumerNumber ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[member.status] ?? "secondary"}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(member.joinDate).toLocaleDateString("en-PK")}
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/members/${member.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
          </>
        )}
      </div>
    </div>
  )
}
