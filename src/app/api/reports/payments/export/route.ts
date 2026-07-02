import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash", BANK_TRANSFER: "Bank Transfer", EASYPAISA: "Easypaisa",
  JAZZCASH: "JazzCash", CARD: "Card", CHEQUE: "Cheque", KUICKPAY: "Kuickpay",
}

const TYPE_LABELS: Record<string, string> = {
  MEMBERSHIP: "Membership", REGISTRATION: "Registration", RENEWAL: "Renewal",
  COURT_BOOKING: "Court Booking", OTHER: "Other",
}

function csvRow(cells: (string | number | null | undefined)[]) {
  return cells.map((c) => {
    const v = c == null ? "" : String(c)
    return v.includes(",") || v.includes('"') || v.includes("\n")
      ? `"${v.replace(/"/g, '""')}"`
      : v
  }).join(",")
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || !["OWNER", "ADMIN", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const fromStr = searchParams.get("from") ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  const toStr = searchParams.get("to") ?? new Date().toISOString().slice(0, 10)
  const methodFilter = searchParams.get("method") ?? ""
  const typeFilter = searchParams.get("type") ?? ""
  const statusFilter = searchParams.get("status") ?? ""

  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId: session.tenantId,
      createdAt: { gte: new Date(fromStr + "T00:00:00.000"), lte: new Date(toStr + "T23:59:59.999") },
      ...(methodFilter ? { paymentMethod: methodFilter as never } : {}),
      ...(typeFilter ? { type: typeFilter as never } : {}),
      ...(statusFilter ? { paymentStatus: statusFilter as never } : {}),
    },
    include: {
      member: { select: { id: true, firstName: true, lastName: true, consumerNumber: true } },
      slotBooking: { select: { customerName: true, customerPhone: true, court: { select: { name: true } } } },
      branch: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10000,
  })

  const rows = [
    csvRow([
      "Invoice Ref", "Member", "Consumer No.", "KuickPay No.",
      "Type", "Amount (PKR)", "Paid (PKR)", "Balance (PKR)",
      "Status", "Payment Method", "Channel",
      "Transaction Date", "Transaction Time",
      "Branch", "KuickPay Txn ID", "KuickPay Bank",
    ]),
    ...invoices.map((inv) => {
      const memberName = inv.member
        ? `${inv.member.firstName} ${inv.member.lastName}`
        : inv.slotBooking?.customerName ?? "Walk-in"

      const consumerNo = inv.member?.consumerNumber ?? ""
      const kuickpayNo = inv.kuickpayConsumerNo ?? ""

      const channel = inv.paymentMethod === "KUICKPAY"
        ? "KuickPay BPS"
        : inv.paymentMethod === "EASYPAISA" || inv.paymentMethod === "JAZZCASH"
        ? "Mobile Wallet"
        : inv.paymentMethod === "BANK_TRANSFER"
        ? "Bank Transfer"
        : inv.paymentMethod
        ? "Counter"
        : ""

      const transactionDate = inv.paidAt ?? inv.createdAt
      const date = new Date(transactionDate).toLocaleDateString("en-PK")
      const time = new Date(transactionDate).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", hour12: true })

      const balance = Number(inv.total) - Number(inv.paidAmount)

      return csvRow([
        inv.id.slice(-8).toUpperCase(),
        memberName,
        consumerNo,
        kuickpayNo,
        TYPE_LABELS[inv.type] ?? inv.type,
        Number(inv.total).toFixed(2),
        Number(inv.paidAmount).toFixed(2),
        balance.toFixed(2),
        inv.paymentStatus,
        inv.paymentMethod ? (METHOD_LABELS[inv.paymentMethod] ?? inv.paymentMethod) : "",
        channel,
        date,
        time,
        inv.branch?.name ?? "",
        inv.kuickpayTranAuthId ?? "",
        inv.kuickpayBankMnemonic ?? "",
      ])
    }),
  ]

  const csv = rows.join("\r\n")
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="payment-report-${fromStr}-to-${toStr}.csv"`,
    },
  })
}
