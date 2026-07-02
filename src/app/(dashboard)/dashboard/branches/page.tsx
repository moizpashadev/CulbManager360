import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { Badge } from "@/components/ui/badge"
import { Plus, MapPin, Users, UserCog } from "lucide-react"

export default async function BranchesPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const branches = await prisma.branch.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          members: true,
          staffBranches: true,
        },
      },
      invoices: {
        where: { paymentStatus: "PAID", createdAt: { gte: monthStart } },
        select: { total: true },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Branches</h1>
          <p className="text-sm text-muted-foreground">{branches.length} location{branches.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/dashboard/branches/new"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Branch
        </Link>
      </div>

      {branches.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-white px-8 py-16 text-center shadow-sm">
          <MapPin className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">No branches yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add your first branch to start organizing members by location.</p>
          <Link
            href="/dashboard/branches/new"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Add Branch
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => {
            const revenue = branch.invoices.reduce((s, inv) => s + Number(inv.total), 0)
            return (
              <Link
                key={branch.id}
                href={`/dashboard/branches/${branch.id}`}
                className="rounded-lg border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{branch.name}</p>
                    {branch.address && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {branch.address}
                      </p>
                    )}
                  </div>
                  <Badge variant={branch.isActive ? "success" : "secondary"}>
                    {branch.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 border-t border-border pt-4">
                  <div>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" /> Members
                    </p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                      {branch._count.members}
                    </p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <UserCog className="h-3 w-3" /> Trainers
                    </p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                      {branch._count.staffBranches}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="mt-0.5 font-mono text-sm font-semibold text-primary">
                      {revenue > 0 ? `PKR ${revenue.toLocaleString("en-PK")}` : "—"}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
