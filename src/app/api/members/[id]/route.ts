import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const member = await prisma.member.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
    include: {
      memberships: {
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      },
      attendance: {
        orderBy: { checkedInAt: "desc" },
        take: 20,
      },
    },
  })

  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })
  return NextResponse.json(member)
}

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const existing = await prisma.member.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
  })
  if (!existing) return NextResponse.json({ error: "Member not found" }, { status: 404 })

  const body = await request.json()
  const {
    firstName, lastName, email, phone, cnic,
    dateOfBirth, emergencyContact, emergencyPhone, medicalNotes, status,
  } = body

  try {
    const updated = await prisma.member.update({
      where: { id: params.id },
      data: {
        firstName: firstName ?? existing.firstName,
        lastName: lastName ?? existing.lastName,
        email: email ? (email as string).toLowerCase().trim() : existing.email,
        phone: phone !== undefined ? (phone || null) : existing.phone,
        cnic: cnic !== undefined ? (cnic || null) : existing.cnic,
        dateOfBirth: dateOfBirth !== undefined
          ? (dateOfBirth ? new Date(dateOfBirth) : null)
          : existing.dateOfBirth,
        emergencyContact: emergencyContact !== undefined ? (emergencyContact || null) : existing.emergencyContact,
        emergencyPhone: emergencyPhone !== undefined ? (emergencyPhone || null) : existing.emergencyPhone,
        medicalNotes: medicalNotes !== undefined ? (medicalNotes || null) : existing.medicalNotes,
        status: status ?? existing.status,
      },
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const existing = await prisma.member.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
  })
  if (!existing) return NextResponse.json({ error: "Member not found" }, { status: 404 })

  await prisma.member.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
