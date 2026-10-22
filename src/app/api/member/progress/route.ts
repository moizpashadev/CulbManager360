import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getMemberSession } from "@/lib/member-auth/session"

export async function GET() {
  const session = await getMemberSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const gymLinks = await prisma.memberGymLink.findMany({
    where: { accountId: session.sub, status: "ACTIVE" },
    select: { memberId: true, tenantId: true, tenant: { select: { name: true } } },
  })

  if (gymLinks.length === 0) {
    return NextResponse.json({ gyms: [], entries: [] })
  }

  const memberIds = gymLinks.map((l) => l.memberId)
  const tenantByMemberId = new Map(gymLinks.map((l) => [l.memberId, l.tenant.name]))

  const entries = await prisma.progressEntry.findMany({
    where: { memberId: { in: memberIds } },
    orderBy: { date: "desc" },
    take: 52, // ~1 year of weekly entries
  })

  return NextResponse.json({
    gyms: gymLinks.map((l) => ({ tenantId: l.tenantId, gymName: l.tenant.name })),
    entries: entries.map((e) => ({
      id: e.id,
      date: e.date,
      weight: e.weight,
      chest: e.chest,
      waist: e.waist,
      hips: e.hips,
      bicep: e.bicep,
      thigh: e.thigh,
      shoulders: e.shoulders,
      notes: e.notes,
      gymName: tenantByMemberId.get(e.memberId) ?? null,
      selfLogged: e.trainerId === null,
    })),
  })
}

export async function POST(request: NextRequest) {
  const session = await getMemberSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { tenantId, weight, chest, waist, hips, bicep, thigh, shoulders, notes } = body

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required (which gym to log against)" }, { status: 400 })
  }
  if ([weight, chest, waist, hips, bicep, thigh, shoulders].every((v) => v === undefined || v === null || v === "")) {
    return NextResponse.json({ error: "Enter at least one measurement" }, { status: 400 })
  }

  const gymLink = await prisma.memberGymLink.findFirst({
    where: { accountId: session.sub, tenantId, status: "ACTIVE" },
  })
  if (!gymLink) {
    return NextResponse.json({ error: "You're not an active member of this gym" }, { status: 403 })
  }

  const num = (v: unknown) => (v === undefined || v === null || v === "" ? null : Number(v))

  const entry = await prisma.progressEntry.create({
    data: {
      memberId: gymLink.memberId,
      tenantId,
      trainerId: null, // self-logged
      weight: num(weight),
      chest: num(chest),
      waist: num(waist),
      hips: num(hips),
      bicep: num(bicep),
      thigh: num(thigh),
      shoulders: num(shoulders),
      notes: notes || null,
    },
  })

  return NextResponse.json(entry, { status: 201 })
}
