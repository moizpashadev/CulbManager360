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
    branchId, registrationFee, registrationPaymentMethod, familyHeadId,
  } = body

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "firstName and lastName are required" }, { status: 400 })
  }
  // Dependents (family members) often don't have their own email — only
  // require one for a regular, standalone member.
  if (!familyHeadId && !email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 })
  }

  try {
    let resolvedFamilyHeadId: string | null = null
    if (familyHeadId) {
      const head = await prisma.member.findFirst({
        where: { id: familyHeadId, tenantId: session.tenantId },
        select: { id: true, familyHeadId: true },
      })
      if (!head) {
        return NextResponse.json({ error: "Family head not found" }, { status: 400 })
      }
      if (head.familyHeadId) {
        return NextResponse.json({ error: "A dependent can't have dependents of their own" }, { status: 400 })
      }
      resolvedFamilyHeadId = head.id
    }

    const existingCount = await prisma.member.count({ where: { tenantId: session.tenantId } })
    const consumerNumber = String(existingCount + 1).padStart(7, "0")

    // A dependent with no email of their own gets a unique, clearly-fake
    // placeholder so the tenantId+email uniqueness constraint is satisfied
    // without asking front-desk staff to invent an address for a child.
    const resolvedEmail = email
      ? (email as string).toLowerCase().trim()
      : `family-${crypto.randomUUID()}@noemail.local`

    const member = await prisma.member.create({
      data: {
        tenantId: session.tenantId,
        familyHeadId: resolvedFamilyHeadId,
        firstName,
        lastName,
        email: resolvedEmail,
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
