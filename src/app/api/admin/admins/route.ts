import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { hashPassword } from "@/lib/auth/password"

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admins = await prisma.superAdmin.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, firstName: true, lastName: true, email: true, isActive: true, createdAt: true },
  })
  return NextResponse.json(admins)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { firstName, lastName, email, password } = body

  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 })
  }
  if ((password as string).length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  }

  try {
    const passwordHash = await hashPassword(password)
    const admin = await prisma.superAdmin.create({
      data: {
        firstName,
        lastName,
        email: (email as string).toLowerCase(),
        passwordHash,
      },
      select: { id: true, firstName: true, lastName: true, email: true, isActive: true, createdAt: true },
    })
    return NextResponse.json(admin, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 })
  }
}
