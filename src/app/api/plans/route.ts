import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function GET() {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const plans = await prisma.membershipPlan.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { memberships: true } },
      facilities: { include: { facility: true } },
    },
  })
  return NextResponse.json(plans)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { name, description, price, durationDays, priceMode, facilityIds } = body

  if (!name || !durationDays) {
    return NextResponse.json({ error: "name and durationDays are required" }, { status: 400 })
  }

  const days = parseInt(durationDays)
  if (isNaN(days) || days < 1) {
    return NextResponse.json({ error: "Duration must be at least 1 day" }, { status: 400 })
  }

  const mode = priceMode === "FACILITY_BASED" ? "FACILITY_BASED" : "MANUAL"
  let finalPrice: number

  if (mode === "FACILITY_BASED") {
    if (!facilityIds?.length) {
      return NextResponse.json({ error: "Select at least one facility" }, { status: 400 })
    }
    const facilities = await prisma.tenantFacility.findMany({
      where: { id: { in: facilityIds }, tenantId: session.tenantId },
    })
    const monthsRatio = days / 30
    finalPrice = facilities.reduce((sum, f) => sum + Number(f.monthlyFee) * monthsRatio, 0)
  } else {
    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 })
    }
    finalPrice = priceNum
  }

  const plan = await prisma.membershipPlan.create({
    data: {
      tenantId: session.tenantId,
      name,
      description: description || null,
      price: finalPrice,
      durationDays: days,
      priceMode: mode,
      ...(mode === "FACILITY_BASED" && facilityIds?.length && {
        facilities: {
          create: (facilityIds as string[]).map((facilityId: string) => ({ facilityId })),
        },
      }),
    },
    include: { facilities: { include: { facility: true } } },
  })
  return NextResponse.json(plan, { status: 201 })
}
