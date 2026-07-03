import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { GenerateButton } from "./generate-button"
import { MarkPaidButton } from "./mark-paid-button"

function fmt(n: unknown) {
  return `PKR ${Number(n).toLocaleString("en-PK")}`
}

const statusColors: Record<string, "success" | "secondary" | "warning" | "destructive"> = {
  PAID: "success",
  PENDING: "secondary",
  OVERDUE: "destructive",
  CANCELLED: "secondary",
}

export default async function AdminBillingPage() {
  const invoices = await prisma.platformInvoice.findMany({
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    include: { tenant: { select: { id: true, name: true, slug: true } } },
  })

  const pendingTotal = invoices
    .filter((i) => i.status === "PENDING" || i.status === "OVERDUE")
    .reduce((sum, i) => sum + Number(i.amount), 0)

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Billing</h1>
          <p className="text-sm text-muted-foreground">Platform subscription invoices for every gym</p>
        </div>
        <GenerateButton />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Invoices", value: invoices.length },
          { label: "Outstanding", value: fmt(pendingTotal), mono: true },
          { label: "Overdue", value: invoices.filter((i) => i.status === "OVERDUE").length },
        ].map(({ label, value, mono }) => (
          <div key={label} className="rounded-lg border border-border bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className={`mt-2 font-bold text-foreground ${mono ? "text-sm font-mono text-primary" : "text-2xl tabular-nums"}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-white shadow-sm">
        {invoices.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No invoices yet. Click &quot;Generate This Month&apos;s Invoices&quot; to create the first billing cycle.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gym</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/tenants/${inv.tenant.id}`} className="hover:underline">
                      {inv.tenant.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{fmt(inv.amount)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(inv.periodStart).toLocaleDateString("en-PK")} – {new Date(inv.periodEnd).toLocaleDateString("en-PK")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(inv.dueDate).toLocaleDateString("en-PK")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[inv.status] ?? "secondary"}>{inv.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {(inv.status === "PENDING" || inv.status === "OVERDUE") && (
                      <MarkPaidButton invoiceId={inv.id} />
                    )}
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
