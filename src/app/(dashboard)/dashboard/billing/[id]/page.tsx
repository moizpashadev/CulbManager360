import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Smartphone } from "lucide-react"
import { MarkPaidButton } from "../mark-paid-button"
import { ReceiptActions } from "./receipt-actions"

type Props = { params: { id: string } }

const paymentColors: Record<string, "success" | "warning" | "secondary"> = {
  PAID: "success", PENDING: "warning", PARTIAL: "warning", WAIVED: "secondary",
}

function fmt(n: unknown) {
  return `PKR ${Number(n).toLocaleString("en-PK")}`
}

export default async function InvoiceReceiptPage({ params }: Props) {
  const session = await getSession()
  if (!session) redirect("/login")

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
    include: {
      member: true,
      membership: { include: { plan: true } },
      branch: true,
      tenant: true,
      slotBooking: { select: { customerName: true, customerPhone: true, court: { select: { name: true, sport: true } } } },
    },
  })

  if (!invoice) notFound()

  const invoiceRef = invoice.id.slice(-8).toUpperCase()
  const amountLabel = fmt(invoice.total)
  const isPending = invoice.paymentStatus === "PENDING" || invoice.paymentStatus === "PARTIAL"

  return (
    <div className="max-w-2xl">
      {/* Nav — hidden on print */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/billing">
            <button className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </button>
          </Link>
          <h1 className="text-xl font-semibold text-foreground">Invoice #{invoiceRef}</h1>
        </div>
        <div className="flex items-center gap-3">
          <ReceiptActions
            memberName={invoice.member
              ? `${invoice.member.firstName} ${invoice.member.lastName}`
              : invoice.slotBooking?.customerName ?? "Walk-in"}
            memberPhone={invoice.member?.phone ?? invoice.slotBooking?.customerPhone ?? null}
            memberEmail={invoice.member?.email ?? null}
            amount={amountLabel}
            invoiceId={invoice.id}
            gymName={invoice.tenant.name}
          />
          {isPending && (
            <MarkPaidButton invoiceId={invoice.id} total={Number(invoice.total)} />
          )}
        </div>
      </div>

      {/* Receipt card — prints cleanly */}
      <div className="rounded-lg border border-border bg-white shadow-sm print:shadow-none print:border-0">
        {/* Header */}
        <div className="border-b border-border px-8 py-6 text-center">
          <p className="text-lg font-bold text-foreground">{invoice.tenant.name}</p>
          {invoice.branch && (
            <p className="text-sm text-muted-foreground">{invoice.branch.name}</p>
          )}
          <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">RECEIPT</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">#{invoiceRef}</p>
        </div>

        {/* Member + dates */}
        <div className="grid grid-cols-2 gap-4 border-b border-border px-8 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Bill To</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {invoice.member
                ? `${invoice.member.firstName} ${invoice.member.lastName}`
                : invoice.slotBooking?.customerName ?? "Walk-in"}
            </p>
            {invoice.member?.email && (
              <p className="text-xs text-muted-foreground">{invoice.member.email}</p>
            )}
            {(invoice.member?.phone ?? invoice.slotBooking?.customerPhone) && (
              <p className="text-xs text-muted-foreground">
                {invoice.member?.phone ?? invoice.slotBooking?.customerPhone}
              </p>
            )}
            {invoice.member?.consumerNumber && (
              <p className="font-mono text-xs text-muted-foreground">
                Consumer #:{" "}
                {invoice.tenant.kuickpayInstitutionId
                  ? `${invoice.tenant.kuickpayInstitutionId}-${invoice.member.consumerNumber}`
                  : invoice.member.consumerNumber}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Details</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Issued: {new Date(invoice.createdAt).toLocaleDateString("en-PK")}
            </p>
            {invoice.dueDate && (
              <p className="text-xs text-muted-foreground">
                Due: {new Date(invoice.dueDate).toLocaleDateString("en-PK")}
              </p>
            )}
            {invoice.paidAt && (
              <p className="text-xs text-muted-foreground">
                Paid: {new Date(invoice.paidAt).toLocaleDateString("en-PK")}
              </p>
            )}
            <div className="mt-2">
              <Badge variant={paymentColors[invoice.paymentStatus] ?? "secondary"}>
                {invoice.paymentStatus}
              </Badge>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="px-8 py-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Description
                </th>
                <th className="pb-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/40">
                <td className="py-3">
                  <p className="font-medium text-foreground capitalize">
                    {invoice.type.toLowerCase().replace("_", " ")}
                    {invoice.membership?.plan && (
                      <span className="ml-1 text-muted-foreground">
                        — {invoice.membership.plan.name}
                      </span>
                    )}
                  </p>
                  {invoice.description && (
                    <p className="text-xs text-muted-foreground">{invoice.description}</p>
                  )}
                </td>
                <td className="py-3 text-right font-mono font-medium text-foreground">
                  {fmt(invoice.subtotal)}
                </td>
              </tr>
              {Number(invoice.discount) > 0 && (
                <tr className="border-b border-border/40">
                  <td className="py-2 text-sm text-muted-foreground">Discount</td>
                  <td className="py-2 text-right font-mono text-sm text-muted-foreground">
                    − {fmt(invoice.discount)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-4 space-y-1.5 border-t border-border pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-mono font-semibold text-foreground">{fmt(invoice.total)}</span>
            </div>
            {Number(invoice.paidAmount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paid</span>
                <span className="font-mono text-green-600">{fmt(invoice.paidAmount)}</span>
              </div>
            )}
            {invoice.paymentStatus === "PARTIAL" && (
              <div className="flex justify-between text-sm font-medium">
                <span className="text-warning">Balance Due</span>
                <span className="font-mono text-warning">
                  {fmt(Number(invoice.total) - Number(invoice.paidAmount))}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Payment info */}
        {(invoice.paymentMethod || invoice.kuickpayTranAuthId) && (
          <div className="border-t border-border px-8 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Payment Info
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {invoice.paymentMethod && (
                <span>Method: <span className="font-medium text-foreground">{invoice.paymentMethod.replace(/_/g, " ")}</span></span>
              )}
              {invoice.kuickpayTranAuthId && (
                <span>Txn ID: <span className="font-mono text-foreground">{invoice.kuickpayTranAuthId}</span></span>
              )}
              {invoice.kuickpayBankMnemonic && (
                <span>Bank: <span className="font-medium text-foreground">{invoice.kuickpayBankMnemonic}</span></span>
              )}
            </div>
          </div>
        )}

        {/* KuickPay pay-by-phone section — shown for unpaid/partial invoices that have a consumer number */}
        {isPending && invoice.kuickpayConsumerNo && (
          <div className="border-t border-primary/20 bg-primary/5 px-8 py-5 print:bg-transparent">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Smartphone className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Pay via Kuickpay</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Use any bank app, JazzCash, or Easypaisa — search &quot;Bill Payment&quot; and enter the details below.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Consumer #</p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-foreground tracking-wider">
                      {invoice.kuickpayConsumerNo}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Amount Due</p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-foreground">
                      {fmt(Number(invoice.total) - Number(invoice.paidAmount))}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Billing Company</p>
                    <p className="mt-0.5 text-sm font-medium text-foreground">{invoice.tenant.name}</p>
                  </div>
                </div>
                <ol className="mt-3 space-y-0.5 text-[11px] text-muted-foreground list-decimal list-inside">
                  <li>Open your bank app → Bill Payment / BBPS</li>
                  <li>Select &quot;{invoice.tenant.name}&quot; or search by institution ID</li>
                  <li>Enter the Consumer # shown above</li>
                  <li>Confirm the amount and pay</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border px-8 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            Thank you for your payment. For queries contact {invoice.tenant.contactEmail ?? invoice.tenant.name}.
          </p>
        </div>
      </div>
    </div>
  )
}
