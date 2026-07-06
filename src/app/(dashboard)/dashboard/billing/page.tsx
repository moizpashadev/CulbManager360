import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { Badge } from "@/components/ui/badge"
import { MarkPaidButton } from "./mark-paid-button"
import { GridSearch } from "@/components/grid-search"
import { Suspense } from "react"
import { Pagination } from "@/components/pagination"
import { Download } from "lucide-react"

const PAGE_SIZE = 50

type SearchParams = { memberId?: string; status?: string; type?: string; q?: string; page?: string }

const paymentColors: Record<string, "success" | "warning" | "secondary"> = {
  PAID: "success", PENDING: "warning", PARTIAL: "warning", WAIVED: "secondary",
}

const typeLabels: Record<string, string> = {
  REGISTRATION: "Registration",
  MEMBERSHIP: "Membership",
  RENEWAL: "Renewal",
  COURT_BOOKING: "Court Booking",
  OTHER: "Other",
}

function fmt(n: unknown) {
  return `PKR ${Number(n).toLocaleString("en-PK")}`
}

export default async function BillingPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession()
  if (!session) redirect("/login")

  const { memberId, status, type, q } = searchParams
  const page = Math.max(1, parseInt(searchParams.page ?? "1"))
  const skip = (page - 1) * PAGE_SIZE

  const where: Record<string, unknown> = { tenantId: session.tenantId }
  if (memberId) where.memberId = memberId
  if (status) where.paymentStatus = status
  if (type) where.type = type
  if (q) {
    where.OR = [
      {
        member: {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
          ],
        },
      },
      { description: { contains: q, mode: "insensitive" } },
    ]
  }

  const [invoices, total, stats] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
          member: { select: { id: true, firstName: true, lastName: true } },
          slotBooking: { select: { customerName: true } },
        },
    }),
    prisma.invoice.count({ where }),
    prisma.invoice.groupBy({
      by: ["paymentStatus"],
      where: { tenantId: session.tenantId },
      _sum: { total: true },
      _count: true,
    }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const totalRevenue = stats.find((s) => s.paymentStatus === "PAID")?._sum.total ?? 0
  const totalPending = stats.find((s) => s.paymentStatus === "PENDING")?._sum.total ?? 0
  const totalCount = stats.reduce((a, s) => a + s._count, 0)

  const isFiltered = !!(memberId || status || type || q)

  function buildHref(p: number) {
    const params = new URLSearchParams()
    if (memberId) params.set("memberId", memberId)
    if (status) params.set("status", status)
    if (type) params.set("type", type)
    if (q) params.set("q", q)
    if (p > 1) params.set("page", String(p))
    const qs = params.toString()
    return `/dashboard/billing${qs ? `?${qs}` : ""}`
  }

  const exportParams = new URLSearchParams()
  if (q) exportParams.set("q", q)
  if (status) exportParams.set("status", status)
  if (type) exportParams.set("type", type)
  if (memberId) exportParams.set("memberId", memberId)
  const exportHref = `/api/billing/export${exportParams.toString() ? `?${exportParams}` : ""}`

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Billing & Invoices</h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} total invoice{totalCount !== 1 ? "s" : ""}
            {q ? ` · ${total} matching "${q}"` : ""}
            {totalPages > 1 && ` · page ${page} of ${totalPages}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Suspense>
            <GridSearch placeholder="Search by member name…" basePath="/dashboard/billing" />
          </Suspense>
          <a
            href={exportHref}
            download
            className="flex h-9 items-center gap-1.5 rounded-md border border-border bg-white px-3 text-sm font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-lg border border-border bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Revenue Collected</p>
          <p className="mt-1 font-mono text-xl font-bold text-primary sm:text-2xl">{fmt(totalRevenue)}</p>
        </div>
        <div className="rounded-lg border border-border bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pending Dues</p>
          <p className="mt-1 font-mono text-xl font-bold text-warning sm:text-2xl">{fmt(totalPending)}</p>
        </div>
        <div className="rounded-lg border border-border bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Invoices</p>
          <p className="mt-1 font-mono text-xl font-bold text-foreground sm:text-2xl">{totalCount}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { label: "All", href: "/dashboard/billing" },
          { label: "Pending", href: "/dashboard/billing?status=PENDING" },
          { label: "Paid", href: "/dashboard/billing?status=PAID" },
          { label: "Partial", href: "/dashboard/billing?status=PARTIAL" },
          { label: "Memberships", href: "/dashboard/billing?type=MEMBERSHIP" },
          { label: "Registration", href: "/dashboard/billing?type=REGISTRATION" },
          { label: "Court Bookings", href: "/dashboard/billing?type=COURT_BOOKING" },
        ].map((f) => {
          const active =
            f.href === "/dashboard/billing"
              ? !status && !type && !memberId && !q
              : (f.href.includes("status=") && `status=${status}` === f.href.split("?")[1]) ||
                (f.href.includes("type=") && `type=${type}` === f.href.split("?")[1])
          return (
            <Link
              key={f.href}
              href={f.href}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                active ? "bg-primary text-white" : "border border-border bg-white text-foreground hover:bg-muted/40"
              }`}
            >
              {f.label}
            </Link>
          )
        })}
        {(memberId || q) && (
          <Link
            href="/dashboard/billing"
            className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/40"
          >
            Clear filters
          </Link>
        )}
      </div>

      <div className="rounded-lg border border-border bg-white shadow-sm">
        {invoices.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            {isFiltered ? "No invoices match the selected filters." : "No invoices yet."}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3">Member</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3 text-right">Total</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-center">Payment</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/10">
                      <td className="px-6 py-3">
                        {inv.member ? (
                          <Link
                            href={`/dashboard/members/${inv.member.id}`}
                            className="font-medium text-foreground hover:text-primary"
                          >
                            {inv.member.firstName} {inv.member.lastName}
                          </Link>
                        ) : (
                          <span className="font-medium text-muted-foreground">
                            {inv.slotBooking?.customerName ?? "Walk-in"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {typeLabels[inv.type] ?? inv.type}
                      </td>
                      <td className="max-w-[180px] truncate px-6 py-3 text-muted-foreground">
                        {inv.description ?? "—"}
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                        {new Date(inv.createdAt).toLocaleDateString("en-PK")}
                      </td>
                      <td className="px-6 py-3 text-right font-mono font-semibold text-foreground">
                        {fmt(inv.total)}
                        {Number(inv.discount) > 0 && (
                          <p className="text-xs text-muted-foreground line-through">{fmt(inv.subtotal)}</p>
                        )}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <Badge variant={paymentColors[inv.paymentStatus] ?? "secondary"}>
                          {inv.paymentStatus}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-center text-xs text-muted-foreground">
                        {inv.paymentMethod?.replace("_", " ") ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/billing/${inv.id}`}
                            className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                          >
                            Receipt
                          </Link>
                          {(inv.paymentStatus === "PENDING" || inv.paymentStatus === "PARTIAL") && (
                            <MarkPaidButton
                              invoiceId={inv.id}
                              total={Number(inv.total)}
                              paidAmount={Number(inv.paidAmount)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
          </>
        )}
      </div>
    </div>
  )
}
