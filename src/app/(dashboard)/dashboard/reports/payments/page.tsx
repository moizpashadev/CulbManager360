import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { Badge } from "@/components/ui/badge"
import { PaymentExportButton } from "./payment-export-button"

type Props = {
  searchParams: {
    from?: string
    to?: string
    method?: string
    type?: string
    status?: string
    page?: string
  }
}

const PAGE_SIZE = 50

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  EASYPAISA: "Easypaisa",
  JAZZCASH: "JazzCash",
  CARD: "Card",
  CHEQUE: "Cheque",
  KUICKPAY: "Kuickpay",
}

const TYPE_LABELS: Record<string, string> = {
  MEMBERSHIP: "Membership",
  REGISTRATION: "Registration",
  RENEWAL: "Renewal",
  COURT_BOOKING: "Court Booking",
  OTHER: "Other",
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  PAID: "success",
  PENDING: "warning",
  PARTIAL: "warning",
  WAIVED: "secondary",
}

function fmt(n: unknown) {
  return `PKR ${Number(n).toLocaleString("en-PK")}`
}

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
}

function fmtTime(d: Date | null | undefined) {
  if (!d) return "—"
  return new Date(d).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", hour12: true })
}

export default async function PaymentReportsPage({ searchParams }: Props) {
  const session = await getSession()
  if (!session) redirect("/login")
  if (!["OWNER", "ADMIN", "MANAGER"].includes(session.role)) redirect("/dashboard")

  const now = new Date()
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const defaultTo = now.toISOString().slice(0, 10)

  const fromStr = searchParams.from ?? defaultFrom
  const toStr = searchParams.to ?? defaultTo
  const methodFilter = searchParams.method ?? ""
  const typeFilter = searchParams.type ?? ""
  const statusFilter = searchParams.status ?? ""
  const page = Math.max(1, parseInt(searchParams.page ?? "1"))

  const rangeStart = new Date(fromStr + "T00:00:00.000")
  const rangeEnd = new Date(toStr + "T23:59:59.999")

  const where = {
    tenantId: session.tenantId,
    createdAt: { gte: rangeStart, lte: rangeEnd },
    ...(methodFilter ? { paymentMethod: methodFilter as never } : {}),
    ...(typeFilter ? { type: typeFilter as never } : {}),
    ...(statusFilter ? { paymentStatus: statusFilter as never } : {}),
  }

  const [invoices, total, summary] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        member: { select: { id: true, firstName: true, lastName: true, consumerNumber: true } },
        slotBooking: { select: { customerName: true, customerPhone: true, court: { select: { name: true } } } },
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),

    prisma.invoice.count({ where }),

    prisma.invoice.aggregate({
      where: { ...where, paymentStatus: "PAID" },
      _sum: { total: true, paidAmount: true },
      _count: { id: true },
    }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function buildHref(overrides: Record<string, string>) {
    const params = new URLSearchParams({
      from: fromStr, to: toStr,
      ...(methodFilter ? { method: methodFilter } : {}),
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      page: String(page),
      ...overrides,
    })
    return `/dashboard/reports/payments?${params.toString()}`
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Payment Reports</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            All transactions — gym memberships and court bookings
          </p>
        </div>
        <PaymentExportButton from={fromStr} to={toStr} method={methodFilter} type={typeFilter} status={statusFilter} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">From</label>
          <input
            type="date"
            defaultValue={fromStr}
            form="filter-form"
            name="from"
            className="h-8 rounded border border-border bg-white px-2 text-xs focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">To</label>
          <input
            type="date"
            defaultValue={toStr}
            form="filter-form"
            name="to"
            className="h-8 rounded border border-border bg-white px-2 text-xs focus:border-primary focus:outline-none"
          />
        </div>

        {/* Filter links */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Status</label>
          <div className="flex gap-1">
            {["", "PAID", "PENDING", "PARTIAL", "WAIVED"].map((s) => (
              <Link
                key={s || "all"}
                href={buildHref({ status: s, page: "1" })}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-primary text-white"
                    : "border border-border bg-white text-muted-foreground hover:bg-muted/40"
                }`}
              >
                {s || "All"}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Type</label>
          <div className="flex gap-1">
            {["", "MEMBERSHIP", "REGISTRATION", "RENEWAL", "COURT_BOOKING", "OTHER"].map((t) => (
              <Link
                key={t || "all"}
                href={buildHref({ type: t, page: "1" })}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  typeFilter === t
                    ? "bg-primary text-white"
                    : "border border-border bg-white text-muted-foreground hover:bg-muted/40"
                }`}
              >
                {t ? TYPE_LABELS[t] ?? t : "All"}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Method</label>
          <div className="flex flex-wrap gap-1">
            {["", ...Object.keys(METHOD_LABELS)].map((m) => (
              <Link
                key={m || "all"}
                href={buildHref({ method: m, page: "1" })}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  methodFilter === m
                    ? "bg-primary text-white"
                    : "border border-border bg-white text-muted-foreground hover:bg-muted/40"
                }`}
              >
                {m ? METHOD_LABELS[m] : "All"}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Transactions", value: String(total) },
          { label: "Paid Transactions", value: String(summary._count.id) },
          { label: "Collected Revenue", value: fmt(summary._sum.total ?? 0), mono: true },
          { label: "Outstanding", value: fmt(
            invoices
              .filter((inv) => inv.paymentStatus === "PENDING" || inv.paymentStatus === "PARTIAL")
              .reduce((s, inv) => s + Number(inv.total) - Number(inv.paidAmount), 0)
          ), mono: true },
        ].map(({ label, value, mono }) => (
          <div key={label} className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className={`mt-3 text-xl font-semibold text-foreground ${mono ? "font-mono" : ""}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {[
                  "Member", "Consumer No.", "Invoice Ref", "Type", "Amount",
                  "Paid", "Status", "Method", "Channel", "Date", "Time", "KP Txn ID",
                ].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-sm text-muted-foreground">
                    No transactions found for the selected filters.
                  </td>
                </tr>
              )}
              {invoices.map((inv) => {
                const memberName = inv.member
                  ? `${inv.member.firstName} ${inv.member.lastName}`
                  : inv.slotBooking?.customerName ?? "Walk-in"
                const memberId = inv.member?.id
                const consumerNo = inv.kuickpayConsumerNo
                  ?? (inv.member?.consumerNumber
                    ? inv.member.consumerNumber
                    : null)
                const invoiceRef = inv.id.slice(-8).toUpperCase()
                const isKuickpay = inv.paymentMethod === "KUICKPAY"

                // Derive channel from payment method
                const channel = inv.paymentMethod === "KUICKPAY"
                  ? "KuickPay BPS"
                  : inv.paymentMethod === "EASYPAISA" || inv.paymentMethod === "JAZZCASH"
                  ? "Mobile Wallet"
                  : inv.paymentMethod === "BANK_TRANSFER"
                  ? "Bank Transfer"
                  : inv.paymentMethod
                  ? "Counter"
                  : "—"

                const transactionDate = inv.paidAt ?? inv.createdAt

                return (
                  <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                    {/* Member */}
                    <td className="whitespace-nowrap px-4 py-3">
                      {memberId ? (
                        <Link href={`/dashboard/members/${memberId}`} className="font-medium text-foreground hover:text-primary">
                          {memberName}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">{memberName}</span>
                      )}
                      {inv.slotBooking?.court && (
                        <p className="text-[11px] text-muted-foreground">{inv.slotBooking.court.name}</p>
                      )}
                      {inv.branch && (
                        <p className="text-[11px] text-muted-foreground">{inv.branch.name}</p>
                      )}
                    </td>

                    {/* Consumer No */}
                    <td className="whitespace-nowrap px-4 py-3">
                      {consumerNo ? (
                        <span className="font-mono text-xs text-foreground">{consumerNo}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Invoice Ref */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link
                        href={`/dashboard/billing/${inv.id}`}
                        className="font-mono text-xs font-medium text-primary hover:underline"
                      >
                        #{invoiceRef}
                      </Link>
                    </td>

                    {/* Type */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        inv.type === "COURT_BOOKING"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-green-50 text-green-700"
                      }`}>
                        {TYPE_LABELS[inv.type] ?? inv.type}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium text-foreground">
                      {fmt(inv.total)}
                    </td>

                    {/* Paid */}
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                      {Number(inv.paidAmount) > 0
                        ? <span className="text-green-700">{fmt(inv.paidAmount)}</span>
                        : <span className="text-muted-foreground">—</span>}
                    </td>

                    {/* Status */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant={STATUS_VARIANT[inv.paymentStatus] ?? "secondary"}>
                        {inv.paymentStatus}
                      </Badge>
                    </td>

                    {/* Method */}
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-foreground">
                      {inv.paymentMethod ? METHOD_LABELS[inv.paymentMethod] ?? inv.paymentMethod : <span className="text-muted-foreground">—</span>}
                    </td>

                    {/* Channel */}
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {channel}
                    </td>

                    {/* Date */}
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-foreground">
                      {fmtDate(transactionDate)}
                    </td>

                    {/* Time */}
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {fmtTime(transactionDate)}
                    </td>

                    {/* KuickPay Txn ID */}
                    <td className="whitespace-nowrap px-4 py-3">
                      {isKuickpay && inv.kuickpayTranAuthId ? (
                        <span className="font-mono text-[11px] text-foreground">{inv.kuickpayTranAuthId}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex gap-1">
              {page > 1 && (
                <Link
                  href={buildHref({ page: String(page - 1) })}
                  className="rounded border border-border bg-white px-3 py-1.5 text-xs text-foreground hover:bg-muted/40"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={buildHref({ page: String(page + 1) })}
                  className="rounded border border-border bg-white px-3 py-1.5 text-xs text-foreground hover:bg-muted/40"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
