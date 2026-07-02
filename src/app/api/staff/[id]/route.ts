import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { hashPassword } from "@/lib/auth/password"

type Params = { params: { id: string } }

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!["OWNER", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const existing = await prisma.staff.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
  })
  if (!existing) return NextResponse.json({ error: "Staff not found" }, { status: 404 })

  // Can't edit the OWNER unless you are the owner
  if (existing.role === "OWNER" && session.role !== "OWNER") {
    return NextResponse.json({ error: "Only the owner can edit the owner account" }, { status: 403 })
  }

  const body = await request.json()
  const { firstName, lastName, role, isActive, password } = body

  const VALID_ROLES = ["ADMIN", "MANAGER", "STAFF", "TRAINER"]
  if (role && !VALID_ROLES.includes(role) && !(existing.role === "OWNER" && role === "OWNER")) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  const data: Record<string, unknown> = {
    firstName: firstName ?? existing.firstName,
    lastName: lastName ?? existing.lastName,
    role: role ?? existing.role,
    isActive: isActive !== undefined ? isActive : existing.isActive,
  }

  if (password) {
    if ((password as string).length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }
    data.passwordHash = await hashPassword(password)
  }

  const updated = await prisma.staff.update({
    where: { id: params.id },
    data,
    select: {
      id: true, firstName: true, lastName: true,
      email: true, role: true, isActive: true,
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.role !== "OWNER") {
    return NextResponse.json({ error: "Only the owner can remove staff" }, { status: 403 })
  }

  const existing = await prisma.staff.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
  })
  if (!existing) return NextResponse.json({ error: "Staff not found" }, { status: 404 })
  if (existing.id === session.sub) {
    return NextResponse.json({ error: "You cannot remove your own account" }, { status: 400 })
  }

  // Soft-delete: deactivate instead of hard delete
  await prisma.staff.update({ where: { id: params.id }, data: { isActive: false } })
  return NextResponse.json({ ok: true })
}
