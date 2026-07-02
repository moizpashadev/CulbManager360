import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

type Params = { params: { id: string } }

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const plan = await prisma.platformPlan.findUnique({ where: { id: params.id } })
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 })

  const body = await request.json()
  const { name, type, description, oneTimePrice, monthlyPrice, features, isActive, sortOrder } = body

  const updated = await prisma.platformPlan.update({
    where: { id: params.id },
    data: {
      name: name ?? plan.name,
      type: type ?? plan.type,
      description: description !== undefined ? description : plan.description,
      oneTimePrice: oneTimePrice !== undefined ? oneTimePrice : plan.oneTimePrice,
      monthlyPrice: monthlyPrice !== undefined ? monthlyPrice : plan.monthlyPrice,
      features: features !== undefined ? features : plan.features,
      isActive: isActive !== undefined ? isActive : plan.isActive,
      sortOrder: sortOrder !== undefined ? sortOrder : plan.sortOrder,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const plan = await prisma.platformPlan.findUnique({
    where: { id: params.id },
    include: { _count: { select: { tenants: true } } },
  })
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 })
  if (plan._count.tenants > 0) {
    return NextResponse.json({ error: "Cannot delete a plan that has gyms assigned to it" }, { status: 400 })
  }

  await prisma.platformPlan.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
