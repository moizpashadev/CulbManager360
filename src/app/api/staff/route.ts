import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { hashPassword } from "@/lib/auth/password"

export async function GET() {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const staff = await prisma.staff.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, firstName: true, lastName: true,
      email: true, role: true, isActive: true, createdAt: true,
    },
  })
  return NextResponse.json(staff)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  // Only OWNER or ADMIN can add staff
  if (!["OWNER", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const body = await request.json()
  const { firstName, lastName, email, password, role } = body

  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 })
  }
  if ((password as string).length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  }

  const VALID_ROLES = ["ADMIN", "MANAGER", "STAFF", "TRAINER"]
  if (role && !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  try {
    const passwordHash = await hashPassword(password)
    const member = await prisma.staff.create({
      data: {
        tenantId: session.tenantId,
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
    return NextResponse.json(member, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 })
  }
}
