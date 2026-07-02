import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

type Params = { params: { id: string } }

export async function POST(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const member = await prisma.member.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
  })
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })

  const body = await request.json()
  const { planId, facilityIds, durationDays, startDate, discount = 0, notes, paymentMethod } = body

  if (!startDate) {
    return NextResponse.json({ error: "startDate is required" }, { status: 400 })
  }

  let plan: { id: string; name: string; price: unknown; durationDays: number } | null = null

  if (facilityIds?.length && durationDays) {
    // Facility-based: auto-create a plan from selected facilities
    const facilities = await prisma.tenantFacility.findMany({
      where: { id: { in: facilityIds as string[] }, tenantId: session.tenantId, isEnabled: true },
    })

    if (facilities.length === 0) {
      return NextResponse.json({ error: "No valid facilities found" }, { status: 400 })
    }

    const monthsRatio = parseInt(durationDays) / 30
    const totalPrice = facilities.reduce((sum, f) => sum + Number(f.monthlyFee) * monthsRatio, 0)

    const facilityNames = facilities.map((f) =>
      f.facilityType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    ).join(", ")

    const days = parseInt(durationDays)
    const durationLabel = days === 30 ? "1 Month" : days === 90 ? "3 Months" : days === 180 ? "6 Months" : days === 365 ? "1 Year" : `${days} Days`

    plan = await prisma.membershipPlan.create({
      data: {
        tenantId: session.tenantId,
        name: `${durationLabel} — ${facilityNames}`,
        price: Math.round(totalPrice),
        durationDays: days,
        priceMode: "FACILITY_BASED",
        isActive: false, // custom plans don't appear in the plans list
        facilities: {
          create: (facilityIds as string[]).map((facilityId: string) => ({ facilityId })),
        },
      },
    })
  } else if (planId) {
    plan = await prisma.membershipPlan.findFirst({
      where: { id: planId, tenantId: session.tenantId, isActive: true },
    })
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 })
  } else {
    return NextResponse.json({ error: "Either planId or facilityIds + durationDays are required" }, { status: 400 })
  }

  const discountAmt = parseFloat(discount) || 0
  const subtotal = Number(plan.price)
  const finalPrice = Math.max(0, subtotal - discountAmt)

  const start = new Date(startDate)
  const end = new Date(start)
  end.setDate(end.getDate() + plan.durationDays)

  await prisma.membership.updateMany({
    where: { memberId: member.id, status: "ACTIVE" },
    data: { status: "CANCELLED" },
  })

  const result = await prisma.$transaction(async (tx) => {
    const membership = await tx.membership.create({
      data: {
        memberId: member.id,
        planId: plan!.id,
        startDate: start,
        endDate: end,
        status: "ACTIVE",
        discount: discountAmt,
        finalPrice,
        notes: notes || null,
      },
    })

    const invoice = await tx.invoice.create({
      data: {
        tenantId: session.tenantId,
        memberId: member.id,
        membershipId: membership.id,
        type: "MEMBERSHIP",
        description: `${plan!.name} — ${plan!.durationDays} days`,
        subtotal,
        discount: discountAmt,
        total: finalPrice,
        paidAmount: paymentMethod ? finalPrice : 0,
        paymentStatus: paymentMethod ? "PAID" : "PENDING",
        paymentMethod: paymentMethod || null,
        paidAt: paymentMethod ? new Date() : null,
      },
    })

    return { membership, invoice }
  })

  await prisma.member.update({
    where: { id: member.id },
    data: { status: "ACTIVE" },
  })

  return NextResponse.json(result, { status: 201 })
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { membershipId } = body
  if (!membershipId) return NextResponse.json({ error: "membershipId required" }, { status: 400 })

  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, member: { tenantId: session.tenantId } },
  })
  if (!membership) return NextResponse.json({ error: "Membership not found" }, { status: 404 })

  const updated = await prisma.membership.update({
    where: { id: membershipId },
    data: { status: "CANCELLED" },
  })

  const stillActive = await prisma.membership.count({
    where: { memberId: params.id, status: "ACTIVE" },
  })
  if (stillActive === 0) {
    await prisma.member.update({
      where: { id: params.id },
      data: { status: "EXPIRED" },
    })
  }

  return NextResponse.json(updated)
}
