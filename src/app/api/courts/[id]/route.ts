import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

type Params = { params: { id: string } }

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!["OWNER", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const existing = await prisma.court.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
  })
  if (!existing) return NextResponse.json({ error: "Court not found" }, { status: 404 })

  const body = await request.json()
  const { name, description, sport, pricePerSlot, slotDuration, openTime, closeTime, isActive } = body

  const updated = await prisma.court.update({
    where: { id: params.id },
    data: {
      name: name ?? existing.name,
      description: description !== undefined ? (description || null) : existing.description,
      sport: sport !== undefined ? (sport || null) : existing.sport,
      pricePerSlot: pricePerSlot != null ? Number(pricePerSlot) : existing.pricePerSlot,
      slotDuration: slotDuration != null ? parseInt(slotDuration) : existing.slotDuration,
      openTime: openTime ?? existing.openTime,
      closeTime: closeTime ?? existing.closeTime,
      isActive: isActive !== undefined ? isActive : existing.isActive,
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!["OWNER", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const existing = await prisma.court.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
  })
  if (!existing) return NextResponse.json({ error: "Court not found" }, { status: 404 })

  await prisma.court.update({ where: { id: params.id }, data: { isActive: false } })
  return NextResponse.json({ ok: true })
}
