import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getMemberSession } from "@/lib/member-auth/session"

export async function GET() {
  const session = await getMemberSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const gymLinks = await prisma.memberGymLink.findMany({
    where: { accountId: session.sub, status: "ACTIVE" },
    select: { tenantId: true, tenant: { select: { moduleCourts: true } } },
  })
  const courtTenantIds = gymLinks.filter((l) => l.tenant.moduleCourts).map((l) => l.tenantId)
  if (courtTenantIds.length === 0) return NextResponse.json({ courts: [] })

  const courts = await prisma.court.findMany({
    where: { tenantId: { in: courtTenantIds }, isActive: true },
    include: { tenant: { select: { name: true } } },
    orderBy: { name: "asc" },
  })

  return NextResponse.json({
    courts: courts.map((c) => ({
      id: c.id,
      name: c.name,
      sport: c.sport,
      pricePerSlot: c.pricePerSlot,
      slotDuration: c.slotDuration,
      openTime: c.openTime,
      closeTime: c.closeTime,
      gymName: c.tenant.name,
    })),
  })
}
