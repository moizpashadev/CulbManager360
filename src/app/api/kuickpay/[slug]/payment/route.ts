import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

type Params = { params: { slug: string } }

function parseTranDateTime(tran_date: string, tran_time: string): Date {
  // tran_date: YYYYMMDD, tran_time: HHMMSS
  const y = tran_date.slice(0, 4)
  const mo = tran_date.slice(4, 6)
  const d = tran_date.slice(6, 8)
  const h = tran_time.slice(0, 2)
  const mi = tran_time.slice(2, 4)
  const s = tran_time.slice(4, 6)
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`)
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json()
    const { consumer_number, bank_mnemonic, tran_auth_id, paid_amount, tran_date, tran_time, reserved } =
      body as {
        consumer_number?: string
        bank_mnemonic?: string
        tran_auth_id?: string
        paid_amount?: string
        tran_date?: string
        tran_time?: string
        reserved?: string
      }

    if (!consumer_number || !tran_auth_id || !paid_amount || !tran_date || !tran_time) {
      return NextResponse.json({
        response_Code: "04",
        response_description: "Missing required fields.",
        Identification_parameter: "",
        reserved: reserved ?? "",
      })
    }

    // Resolve tenant by slug
    const tenant = await prisma.tenant.findUnique({ where: { slug: params.slug } })
    if (!tenant) {
      return NextResponse.json({
        response_Code: "01",
        response_description: "Unknown biller.",
        Identification_parameter: "",
        reserved: reserved ?? "",
      })
    }

    // Look up member
    const member = await prisma.member.findFirst({
      where: { tenantId: tenant.id, consumerNumber: consumer_number },
    })
    if (!member) {
      return NextResponse.json({
        response_Code: "01",
        response_description: "Invalid Voucher Number.",
        Identification_parameter: "",
        reserved: reserved ?? "",
      })
    }

    // Idempotency: check if this consumer+tran_auth_id was already processed
    const duplicate = await prisma.invoice.findFirst({
      where: {
        tenantId: tenant.id,
        memberId: member.id,
        kuickpayTranAuthId: tran_auth_id,
      },
    })
    if (duplicate) {
      return NextResponse.json({
        response_Code: "03",
        response_description: "Already paid — duplicate transaction.",
        Identification_parameter: duplicate.id,
        reserved: reserved ?? "",
      })
    }

    // Blocked member
    if (member.status === "SUSPENDED") {
      return NextResponse.json({
        response_Code: "02",
        response_description: "Voucher is blocked. Payment not allowed.",
        Identification_parameter: "",
        reserved: reserved ?? "",
      })
    }

    // Find the oldest pending/partial invoice to pay
    const invoice = await prisma.invoice.findFirst({
      where: {
        tenantId: tenant.id,
        memberId: member.id,
        paymentStatus: { in: ["PENDING", "PARTIAL"] },
      },
      orderBy: { createdAt: "asc" },
    })

    if (!invoice) {
      return NextResponse.json({
        response_Code: "03",
        response_description: "No outstanding bill — already paid.",
        Identification_parameter: "",
        reserved: reserved ?? "",
      })
    }

    // Convert paid_amount from paisa to PKR
    const paidPKR = Number(paid_amount) / 100
    const total = Number(invoice.total)
    const paidAt = parseTranDateTime(tran_date, tran_time)

    const newStatus = paidPKR >= total ? "PAID" : "PARTIAL"

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paymentStatus: newStatus,
        paymentMethod: "KUICKPAY",
        paidAmount: Math.min(paidPKR, total),
        paidAt,
        kuickpayTranAuthId: tran_auth_id,
        kuickpayBankMnemonic: bank_mnemonic ?? null,
      },
    })

    return NextResponse.json({
      response_Code: "00",
      response_description: "Payment Successful",
      Identification_parameter: invoice.id,
      reserved: reserved ?? "",
    })
  } catch (err) {
    console.error("[kuickpay/payment]", err)
    return NextResponse.json({
      response_Code: "05",
      response_description: "Internal server error.",
      Identification_parameter: "",
      reserved: "",
    })
  }
}
