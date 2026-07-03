import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { hashPassword } from "@/lib/auth/password"

const VALID_ROLES = ["OWNER", "ADMIN", "MANAGER", "STAFF", "TRAINER"]

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { firstName, lastName, email, password, role } = body

  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 })
  }
  if ((password as string).length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  }
  if (role && !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: params.id }, select: { id: true } })
  if (!tenant) {
    return NextResponse.json({ error: "Gym not found" }, { status: 404 })
  }

  try {
    const passwordHash = await hashPassword(password)
    const staff = await prisma.staff.create({
      data: {
        tenantId: tenant.id,
        firstName,
        lastName,
        email: (email as string).toLowerCase(),
        passwordHash,
        role: role ?? "STAFF",
      },
      select: {
        id: true, firstName: true, lastName: true,
        email: true, role: true, isActive: true, createdAt: true,
      },
    })
    return NextResponse.json(staff, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Email already in use for this gym" }, { status: 409 })
  }
}
