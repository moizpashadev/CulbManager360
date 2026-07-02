import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

type Params = { params: { slug: string } }

function yyyymmdd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}${m}${d}`
}

function yymm(date: Date): string {
  const y = String(date.getFullYear()).slice(2)
  const m = String(date.getMonth() + 1).padStart(2, "0")
  return `${y}${m}`
}

function toPaisa(pkr: unknown): string {
  return String(Math.round(Number(pkr) * 100))
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json()
    const { consumer_number, reserved } = body as {
      consumer_number?: string
      bank_mnemonic?: string
      reserved?: string
    }

    if (!consumer_number) {
      return NextResponse.json({
        response_Code: "04",
        response_description: "consumer_number is required.",
      })
    }

    // Resolve tenant by slug
    const tenant = await prisma.tenant.findUnique({ where: { slug: params.slug } })
    if (!tenant) {
      return NextResponse.json({
        response_Code: "03",
        response_description: "Unknown biller.",
      })
    }

    // Look up member by consumerNumber within this tenant
    const member = await prisma.member.findFirst({
      where: { tenantId: tenant.id, consumerNumber: consumer_number },
    })
    if (!member) {
      return NextResponse.json({
        response_Code: "01",
        response_description: "Consumer number not found.",
      })
    }

    const institutionId = tenant.kuickpayInstitutionId ?? tenant.slug.toUpperCase()
    const institutionName = tenant.name

    // Blocked member
    if (member.status === "SUSPENDED") {
      return NextResponse.json({
        response_Code: "00",
        response_description: "Bill Found",
        consumer_detail: `${member.firstName} ${member.lastName}`.toUpperCase(),
        bill_status: "B",
        due_date: yyyymmdd(endOfMonth(new Date())),
        amount_within_due_date: "0",
        amount_after_due_date: "0",
        billing_month: yymm(new Date()),
        date_paid: "",
        amount_paid: "",
        tran_auth_id: "",
        contact_number: member.phone ?? "",
        email: member.email,
        reserved: reserved ?? "",
        institution_id: institutionId,
        institution_name: institutionName,
      })
    }

    // Find oldest pending/partial invoice
    const pendingInvoice = await prisma.invoice.findFirst({
      where: {
        tenantId: tenant.id,
        memberId: member.id,
        paymentStatus: { in: ["PENDING", "PARTIAL"] },
      },
      orderBy: { createdAt: "asc" },
    })

    if (!pendingInvoice) {
      // All paid — find most recent paid invoice for reference amounts
      const lastPaid = await prisma.invoice.findFirst({
        where: { tenantId: tenant.id, memberId: member.id, paymentStatus: "PAID" },
        orderBy: { paidAt: "desc" },
      })

      const amountPaisa = lastPaid ? toPaisa(lastPaid.total) : "0"
      const datePaid = lastPaid?.paidAt ? yyyymmdd(lastPaid.paidAt) : ""
      const tranAuthId = lastPaid?.kuickpayTranAuthId ?? ""

      return NextResponse.json({
        response_Code: "00",
        response_description: "Bill Found",
        consumer_detail: `${member.firstName} ${member.lastName}`.toUpperCase(),
        bill_status: "P",
        due_date: yyyymmdd(endOfMonth(new Date())),
        amount_within_due_date: amountPaisa,
        amount_after_due_date: amountPaisa,
        billing_month: yymm(new Date()),
        date_paid: datePaid,
        amount_paid: amountPaisa,
        tran_auth_id: tranAuthId,
        contact_number: member.phone ?? "",
        email: member.email,
        reserved: reserved ?? "",
        institution_id: institutionId,
        institution_name: institutionName,
      })
    }

    // Has unpaid invoice
    const dueDate = pendingInvoice.dueDate ?? endOfMonth(new Date())
    const amountPaisa = toPaisa(pendingInvoice.total)
    // 10% surcharge after due date
    const surchargePaisa = String(Math.round(Number(pendingInvoice.total) * 1.1 * 100))
    const alreadyPaidPaisa = toPaisa(pendingInvoice.paidAmount)

    return NextResponse.json({
      response_Code: "00",
      response_description: "Bill Found",
      consumer_detail: `${member.firstName} ${member.lastName}`.toUpperCase(),
      bill_status: "U",
      due_date: yyyymmdd(dueDate),
      amount_within_due_date: amountPaisa,
      amount_after_due_date: surchargePaisa,
      billing_month: yymm(pendingInvoice.createdAt),
      date_paid: "",
      amount_paid: pendingInvoice.paymentStatus === "PARTIAL" ? alreadyPaidPaisa : "",
      tran_auth_id: "",
      contact_number: member.phone ?? "",
      email: member.email,
      reserved: reserved ?? "",
      institution_id: institutionId,
      institution_name: institutionName,
    })
  } catch (err) {
    console.error("[kuickpay/inquiry]", err)
    return NextResponse.json({
      response_Code: "05",
      response_description: "Internal server error.",
    })
  }
}
