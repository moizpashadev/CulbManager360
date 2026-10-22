import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getMemberSession } from "@/lib/member-auth/session"

export async function GET() {
  const session = await getMemberSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const account = await prisma.memberAccount.findUnique({
    where: { id: session.sub },
  })
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 })
  }

  const gymLinks = await prisma.memberGymLink.findMany({
    where: { accountId: account.id },
    include: { tenant: { select: { name: true, slug: true } } },
    orderBy: { joinedAt: "desc" },
  })

  return NextResponse.json({
    email: account.email,
    gymLinks: gymLinks.map((l) => ({
      tenantName: l.tenant.name,
      tenantSlug: l.tenant.slug,
      status: l.status,
      joinedAt: l.joinedAt,
      leftAt: l.leftAt,
    })),
  })
}
