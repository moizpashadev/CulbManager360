import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { verifyPassword } from "@/lib/auth/password"
import { signToken, COOKIE_NAME } from "@/lib/auth/jwt"

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
  }

  const lowerEmail = (email as string).toLowerCase()

  // 1. Check super admin first
  const superAdmin = await prisma.superAdmin.findUnique({ where: { email: lowerEmail } })
  if (superAdmin) {
    const valid = await verifyPassword(password, superAdmin.passwordHash)
    if (!valid) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })

    const token = await signToken({
      sub: superAdmin.id,
      tenantId: "__super__",
      tenantName: "Club Manager 360",
      role: "SUPER_ADMIN",
      firstName: superAdmin.firstName,
      lastName: superAdmin.lastName,
      moduleGym: true,
      moduleCourts: true,
    })

    const res = NextResponse.json({ ok: true, redirect: "/admin" })
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })
    return res
  }

  // 2. Regular gym staff
  const staff = await prisma.staff.findFirst({
    where: { email: lowerEmail, isActive: true },
    include: { tenant: { select: { name: true, moduleGym: true, moduleCourts: true } } },
  })

  if (!staff) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })

  const valid = await verifyPassword(password, staff.passwordHash)
  if (!valid) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })

  const token = await signToken({
    sub: staff.id,
    tenantId: staff.tenantId,
    tenantName: staff.tenant.name,
    role: staff.role,
    firstName: staff.firstName,
    lastName: staff.lastName,
    moduleGym: staff.tenant.moduleGym,
    moduleCourts: staff.tenant.moduleCourts,
  })

  const response = NextResponse.json({ ok: true, redirect: "/dashboard" })
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })
  return response
}
