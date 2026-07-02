import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function GET() {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const members = await prisma.member.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(members)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const {
    firstName, lastName, email, phone, cnic,
    dateOfBirth, emergencyContact, emergencyPhone, medicalNotes,
    branchId, registrationFee, registrationPaymentMethod,
  } = body

  if (!firstName || !lastName || !email) {
    return NextResponse.json({ error: "firstName, lastName and email are required" }, { status: 400 })
  }

  try {
    const existingCount = await prisma.member.count({ where: { tenantId: session.tenantId } })
    const consumerNumber = String(existingCount + 1).padStart(7, "0")

    const member = await prisma.member.create({
      data: {
        tenantId: session.tenantId,
        firstName,
        lastName,
        email: (email as string).toLowerCase().trim(),
        phone: phone ?? null,
        cnic: cnic ?? null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        emergencyContact: emergencyContact ?? null,
        emergencyPhone: emergencyPhone ?? null,
        medicalNotes: medicalNotes ?? null,
        branchId: branchId ?? null,
        consumerNumber,
      },
    })

    // Create registration fee invoice if provided
    if (registrationFee && Number(registrationFee) > 0) {
      const fee = Number(registrationFee)
      await prisma.invoice.create({
        data: {
          tenantId: session.tenantId,
          memberId: member.id,
          type: "REGISTRATION",
          description: "One-time registration fee",
          subtotal: fee,
          discount: 0,
          total: fee,
          paidAmount: registrationPaymentMethod ? fee : 0,
          paymentStatus: registrationPaymentMethod ? "PAID" : "PENDING",
          paymentMethod: registrationPaymentMethod || null,
          paidAt: registrationPaymentMethod ? new Date() : null,
        },
      })
    }

    return NextResponse.json(member, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Email already exists for this gym" }, { status: 409 })
  }
}
