import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)

  const branch = await prisma.branch.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
    include: {
      members: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          memberships: {
            where: { status: "ACTIVE" },
            include: { plan: { select: { name: true } } },
            take: 1,
          },
        },
      },
      staffBranches: {
        include: {
          staff: {
            select: {
              id: true, firstName: true, lastName: true,
              role: true, employmentType: true, specialization: true, isActive: true,
            },
          },
        },
      },
      attendance: {
        where: { checkedInAt: { gte: today, lt: tomorrow } },
        include: { member: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { checkedInAt: "desc" },
      },
      invoices: {
        where: { paymentStatus: "PAID", createdAt: { gte: monthStart } },
        select: { total: true },
      },
    },
  })

  if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 })
  return NextResponse.json(branch)
}

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const existing = await prisma.branch.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
  })
  if (!existing) return NextResponse.json({ error: "Branch not found" }, { status: 404 })

  const body = await request.json()
  const { name, address, phone, email, isActive } = body

  const updated = await prisma.branch.update({
    where: { id: params.id },
    data: {
      name: name?.trim() ?? existing.name,
      address: address !== undefined ? (address || null) : existing.address,
      phone: phone !== undefined ? (phone || null) : existing.phone,
      email: email !== undefined ? (email?.toLowerCase() || null) : existing.email,
      isActive: isActive !== undefined ? isActive : existing.isActive,
    },
  })

  return NextResponse.json(updated)
}
