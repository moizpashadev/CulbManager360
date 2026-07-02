import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const member = await prisma.member.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
  })
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const entries = await prisma.progressEntry.findMany({
    where: { memberId: params.id, tenantId: session.tenantId },
    orderBy: { date: "desc" },
    include: {
      trainer: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  return NextResponse.json(entries)
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const member = await prisma.member.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
  })
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const { date, weight, chest, waist, hips, bicep, thigh, shoulders, notes, trainerId } = body

  const entry = await prisma.progressEntry.create({
    data: {
      memberId: params.id,
      tenantId: session.tenantId,
      trainerId: trainerId || null,
      date: date ? new Date(date) : new Date(),
      weight: weight ? parseFloat(weight) : null,
      chest: chest ? parseFloat(chest) : null,
      waist: waist ? parseFloat(waist) : null,
      hips: hips ? parseFloat(hips) : null,
      bicep: bicep ? parseFloat(bicep) : null,
      thigh: thigh ? parseFloat(thigh) : null,
      shoulders: shoulders ? parseFloat(shoulders) : null,
      notes: notes || null,
    },
    include: {
      trainer: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  return NextResponse.json(entry, { status: 201 })
}
