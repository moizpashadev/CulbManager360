import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

type Params = { params: { id: string } }

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const existing = await prisma.membershipPlan.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
  })
  if (!existing) return NextResponse.json({ error: "Plan not found" }, { status: 404 })

  const body = await request.json()
  const { name, description, price, durationDays, isActive, priceMode, facilityIds } = body

  const days = durationDays !== undefined ? parseInt(durationDays) : existing.durationDays
  const mode = priceMode ?? existing.priceMode

  let finalPrice: number = Number(existing.price)

  if (mode === "FACILITY_BASED") {
    const ids = facilityIds as string[] | undefined
    if (ids?.length) {
      const facilities = await prisma.tenantFacility.findMany({
        where: { id: { in: ids }, tenantId: session.tenantId },
      })
      const monthsRatio = days / 30
      finalPrice = facilities.reduce((sum, f) => sum + Number(f.monthlyFee) * monthsRatio, 0)
    }
  } else if (price !== undefined) {
    finalPrice = parseFloat(price)
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (mode === "FACILITY_BASED" && facilityIds) {
      await tx.planFacility.deleteMany({ where: { planId: params.id } })
      if (facilityIds.length > 0) {
        await tx.planFacility.createMany({
          data: (facilityIds as string[]).map((facilityId: string) => ({
            planId: params.id,
            facilityId,
          })),
        })
      }
    } else if (mode === "MANUAL") {
      await tx.planFacility.deleteMany({ where: { planId: params.id } })
    }

    return tx.membershipPlan.update({
      where: { id: params.id },
      data: {
        name: name ?? existing.name,
        description: description !== undefined ? (description || null) : existing.description,
        price: finalPrice,
        durationDays: days,
        priceMode: mode,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
      include: { facilities: { include: { facility: true } } },
    })
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const existing = await prisma.membershipPlan.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
  })
  if (!existing) return NextResponse.json({ error: "Plan not found" }, { status: 404 })

  const updated = await prisma.membershipPlan.update({
    where: { id: params.id },
    data: { isActive: false },
  })
  return NextResponse.json(updated)
}
