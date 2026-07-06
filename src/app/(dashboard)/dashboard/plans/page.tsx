import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus } from "lucide-react"
import { PlanActions } from "./plan-actions"
import { GridSearch } from "@/components/grid-search"
import { Suspense } from "react"

export default async function PlansPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string }
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const { q, status } = searchParams

  const where: Record<string, unknown> = {
    tenantId: session.tenantId,
    // hide auto-generated per-member plans (facility-based + inactive)
    NOT: { AND: [{ isActive: false }, { priceMode: "FACILITY_BASED" }] },
  }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ]
  }
  if (status === "active") where.isActive = true
  if (status === "inactive") where.isActive = false

  const plans = await prisma.membershipPlan.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { memberships: { where: { status: "ACTIVE" } } } } },
  })

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Plans & Billing</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {plans.length} {q ? "matching " : ""}plan{plans.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Suspense>
            <GridSearch placeholder="Search plans…" basePath="/dashboard/plans" />
          </Suspense>
          <Link href="/dashboard/plans/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Plan
            </Button>
          </Link>
        </div>
      </div>

      {/* Status filters */}
      <div className="mb-4 flex gap-2">
        {[
          { label: "All", href: q ? `/dashboard/plans?q=${q}` : "/dashboard/plans" },
          { label: "Active", href: q ? `/dashboard/plans?q=${q}&status=active` : "/dashboard/plans?status=active" },
          { label: "Inactive", href: q ? `/dashboard/plans?q=${q}&status=inactive` : "/dashboard/plans?status=inactive" },
        ].map((f) => {
          const active = f.label === "All" ? !status : status === f.label.toLowerCase()
          return (
            <Link
              key={f.label}
              href={f.href}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                active ? "bg-primary text-white" : "border border-border bg-white text-foreground hover:bg-muted/40"
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      <div className="rounded-lg border border-border bg-white shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-medium text-foreground">
            {q ? `Results for "${q}"` : "All Plans"}
          </h2>
        </div>

        {plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {q ? `No plans match "${q}".` : "No plans yet."}
            </p>
            {!q && (
              <Link href="/dashboard/plans/new" className="mt-4">
                <Button variant="outline" size="sm">Create your first plan</Button>
              </Link>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan Name</TableHead>
                <TableHead>Price (PKR)</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Active Members</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{plan.name}</p>
                      {plan.description && (
                        <p className="text-xs text-muted-foreground">{plan.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {Number(plan.price).toLocaleString("en-PK")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {plan.durationDays} days
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({Math.round(plan.durationDays / 30)} mo)
                    </span>
                  </TableCell>
                  <TableCell className="tabular-nums">{plan._count.memberships}</TableCell>
                  <TableCell>
                    <Badge variant={plan.isActive ? "success" : "secondary"}>
                      {plan.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <PlanActions planId={plan.id} isActive={plan.isActive} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
