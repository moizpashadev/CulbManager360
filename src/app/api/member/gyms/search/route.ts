import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getMemberSession } from "@/lib/member-auth/session"

export async function GET(request: NextRequest) {
  const session = await getMemberSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const q = new URL(request.url).searchParams.get("q")?.trim()
  if (!q || q.length < 2) return NextResponse.json({ gyms: [] })

  const [tenants, existingLinks, existingRequests] = await Promise.all([
    prisma.tenant.findMany({
      where: { name: { contains: q, mode: "insensitive" }, isActive: true },
      select: { id: true, name: true, slug: true },
      take: 10,
    }),
    prisma.memberGymLink.findMany({
      where: { accountId: session.sub },
      select: { tenantId: true },
    }),
    prisma.memberJoinRequest.findMany({
      where: { accountId: session.sub, status: "PENDING" },
      select: { tenantId: true },
    }),
  ])

  const linkedTenantIds = new Set(existingLinks.map((l) => l.tenantId))
  const pendingTenantIds = new Set(existingRequests.map((r) => r.tenantId))

  return NextResponse.json({
    gyms: tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      alreadyLinked: linkedTenantIds.has(t.id),
      requestPending: pendingTenantIds.has(t.id),
    })),
  })
}
