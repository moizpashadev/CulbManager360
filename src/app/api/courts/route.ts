import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function GET() {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const courts = await prisma.court.findMany({
    where: { tenantId: session.tenantId, isActive: true },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(courts)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!["OWNER", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const body = await request.json()
  const { name, description, sport, pricePerSlot, slotDuration, openTime, closeTime } = body

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }

  const court = await prisma.court.create({
    data: {
      tenantId: session.tenantId,
      name,
      description: description || null,
      sport: sport || null,
      pricePerSlot: pricePerSlot != null ? Number(pricePerSlot) : 0,
      slotDuration: slotDuration ? parseInt(slotDuration) : 60,
      openTime: openTime || "06:00",
      closeTime: closeTime || "22:00",
    },
  })
  return NextResponse.json(court, { status: 201 })
}
