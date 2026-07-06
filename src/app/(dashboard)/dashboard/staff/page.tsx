import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus } from "lucide-react"
import { StaffActions } from "./staff-actions"
import { GridSearch } from "@/components/grid-search"
import { Suspense } from "react"

const ROLE_COLORS: Record<string, "success" | "secondary" | "warning" | "destructive"> = {
  OWNER: "success",
  ADMIN: "warning",
  MANAGER: "secondary",
  STAFF: "secondary",
  TRAINER: "secondary",
}

const ROLES = ["OWNER", "ADMIN", "MANAGER", "STAFF", "TRAINER"]

export default async function StaffPage({
  searchParams,
}: {
  searchParams: { q?: string; role?: string }
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const { q, role } = searchParams

  const where: Record<string, unknown> = { tenantId: session.tenantId }
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ]
  }
  if (role && ROLES.includes(role)) where.role = role

  const staff = await prisma.staff.findMany({
    where,
    orderBy: [{ role: "asc" }, { firstName: "asc" }],
    select: {
      id: true, firstName: true, lastName: true,
      email: true, role: true, isActive: true, createdAt: true,
    },
  })

  const canManage = ["OWNER", "ADMIN"].includes(session.role)

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Staff</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {staff.length} {q || role ? "matching " : ""}team member{staff.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Suspense>
            <GridSearch placeholder="Search by name or email…" basePath="/dashboard/staff" />
          </Suspense>
          {canManage && (
            <Link href="/dashboard/staff/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Staff
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Role filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {["All", ...ROLES].map((r) => {
          const isAll = r === "All"
          const active = isAll ? !role : role === r
          const params = new URLSearchParams()
          if (q) params.set("q", q)
          if (!isAll) params.set("role", r)
          return (
            <Link
              key={r}
              href={`/dashboard/staff${params.toString() ? `?${params}` : ""}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                active ? "bg-primary text-white" : "border border-border bg-white text-foreground hover:bg-muted/40"
              }`}
            >
              {r.charAt(0) + r.slice(1).toLowerCase()}
            </Link>
          )
        })}
      </div>

      <div className="rounded-lg border border-border bg-white shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-medium text-foreground">
            {q ? `Results for "${q}"` : role ? `${role.charAt(0) + role.slice(1).toLowerCase()} members` : "Team Members"}
          </h2>
        </div>

        {staff.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {q ? `No staff match "${q}".` : "No staff found."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                {canManage && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    {s.firstName} {s.lastName}
                    {s.id === session.sub && (
                      <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{s.email}</TableCell>
                  <TableCell>
                    <Badge variant={ROLE_COLORS[s.role] ?? "secondary"}>{s.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.isActive ? "success" : "secondary"}>
                      {s.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString("en-PK")}
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      {s.id !== session.sub && s.role !== "OWNER" && (
                        <StaffActions
                          staffId={s.id}
                          isActive={s.isActive}
                          canDelete={session.role === "OWNER"}
                        />
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
