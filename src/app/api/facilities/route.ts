import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { FACILITY_CATALOG } from "@/lib/facilities"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const existing = await prisma.tenantFacility.findMany({
    where: { tenantId: session.tenantId },
  })

  const map = new Map(existing.map((f) => [f.facilityType as string, f]))

  const facilities = FACILITY_CATALOG.map((item) => {
    const record = map.get(item.type)
    return {
      type: item.type,
      label: item.label,
      icon: item.icon,
      category: item.category,
      isEnabled: record ? record.isEnabled : false,
      monthlyFee: record ? Number(record.monthlyFee) : 0,
      notes: record?.notes ?? null,
      id: record?.id ?? null,
    }
  })

  return NextResponse.json(facilities)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!["OWNER", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { facilityType, isEnabled, monthlyFee, notes } = await req.json()
  if (!facilityType) return NextResponse.json({ error: "facilityType required" }, { status: 400 })

  const fee = monthlyFee !== undefined ? parseFloat(monthlyFee) : undefined

  const facility = await prisma.tenantFacility.upsert({
    where: { tenantId_facilityType: { tenantId: session.tenantId, facilityType } },
    create: {
      tenantId: session.tenantId,
      facilityType,
      isEnabled: isEnabled ?? true,
      monthlyFee: fee ?? 0,
      notes,
    },
    update: {
      isEnabled: isEnabled ?? true,
      ...(fee !== undefined && { monthlyFee: fee }),
      notes,
      updatedAt: new Date(),
    },
  })

  return NextResponse.json({ ...facility, monthlyFee: Number(facility.monthlyFee) })
}
