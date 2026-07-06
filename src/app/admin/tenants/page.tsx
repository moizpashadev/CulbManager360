import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus } from "lucide-react"

const subStatusColors: Record<string, string> = {
  TRIAL:     "bg-blue-50 text-blue-700 border border-blue-200",
  ACTIVE:    "bg-green-50 text-green-700 border border-green-200",
  PAST_DUE:  "bg-amber-50 text-amber-700 border border-amber-200",
  SUSPENDED: "bg-red-50 text-red-700 border border-red-200",
  CANCELLED: "bg-gray-50 text-gray-600 border border-gray-200",
}

async function getTenants() {
  return prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { members: true, staff: true } },
      platformPlan: { select: { name: true, type: true } },
    },
  })
}

export default async function TenantsPage() {
  const tenants = await getTenants()

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Gyms & Clubs</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{tenants.length} registered gyms</p>
        </div>
        <Link href="/admin/tenants/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Gym
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-white shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-medium text-foreground">All Gyms</h2>
        </div>

        {tenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">No gyms yet.</p>
            <Link href="/admin/tenants/new" className="mt-4">
              <Button variant="outline" size="sm">Add your first gym</Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gym Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((t) => (
                <TableRow key={t.id} className="cursor-pointer hover:bg-muted/20">
                  <TableCell className="font-medium">
                    <Link href={`/admin/tenants/${t.id}`} className="hover:text-primary">
                      {t.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{t.slug}</TableCell>
                  <TableCell className="text-sm">{t.contactEmail ?? "—"}</TableCell>
                  <TableCell className="tabular-nums">{t._count.members}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {t.platformPlan?.name ?? <span className="italic text-muted-foreground/60">None</span>}
                  </TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${subStatusColors[t.subscriptionStatus] ?? ""}`}>
                      {t.subscriptionStatus}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.isActive ? "success" : "secondary"}>
                      {t.isActive ? "Active" : "Suspended"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(t.createdAt).toLocaleDateString("en-PK")}
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
