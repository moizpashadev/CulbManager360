import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, ShieldCheck } from "lucide-react"
import { AdminToggle } from "./admin-toggle"

export default async function SuperAdminsPage() {
  const session = await getSession()
  if (!session || session.role !== "SUPER_ADMIN") redirect("/login")

  const admins = await prisma.superAdmin.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, firstName: true, lastName: true, email: true, isActive: true, createdAt: true },
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Super Admins</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {admins.length} platform administrator{admins.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/admin/admins/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Admin
          </Button>
        </Link>
      </div>

      {/* Info callout */}
      <div className="mb-5 flex items-start gap-3 rounded-lg border border-primary/20 bg-secondary/60 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-sm text-foreground">
          Super Admins have full access to the Club Manager 360 platform — they can create and manage all gyms.
          Only add people you fully trust.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-white shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-medium text-foreground">All Platform Admins</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Added</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">
                  {a.firstName} {a.lastName}
                  {a.id === session.sub && (
                    <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-sm">{a.email}</TableCell>
                <TableCell>
                  <Badge variant={a.isActive ? "success" : "secondary"}>
                    {a.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(a.createdAt).toLocaleDateString("en-PK")}
                </TableCell>
                <TableCell>
                  {a.id !== session.sub && (
                    <AdminToggle adminId={a.id} isActive={a.isActive} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
