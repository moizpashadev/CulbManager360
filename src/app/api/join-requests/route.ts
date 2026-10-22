import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function GET() {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const requests = await prisma.memberJoinRequest.findMany({
    where: { tenantId: session.tenantId, status: "PENDING" },
    include: { account: { select: { email: true } } },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(requests)
}
