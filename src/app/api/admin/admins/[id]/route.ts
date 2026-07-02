import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

type Params = { params: { id: string } }

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.sub === params.id) {
    return NextResponse.json({ error: "You cannot modify your own account here" }, { status: 400 })
  }

  const existing = await prisma.superAdmin.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: "Admin not found" }, { status: 404 })

  const body = await request.json()
  const updated = await prisma.superAdmin.update({
    where: { id: params.id },
    data: { isActive: body.isActive !== undefined ? body.isActive : existing.isActive },
    select: { id: true, firstName: true, lastName: true, email: true, isActive: true },
  })
  return NextResponse.json(updated)
}
