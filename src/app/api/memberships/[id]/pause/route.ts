import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

type Params = { params: { id: string } }

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const membership = await prisma.membership.findFirst({
    where: { id: params.id, member: { tenantId: session.tenantId } },
    include: { member: true },
  })
  if (!membership) return NextResponse.json({ error: "Membership not found" }, { status: 404 })

  const { action } = await request.json() as { action: "pause" | "resume" }

  if (action === "pause") {
    if (membership.status !== "ACTIVE") {
      return NextResponse.json({ error: "Only active memberships can be paused" }, { status: 400 })
    }
    await prisma.membership.update({
      where: { id: params.id },
      data: { status: "PAUSED" },
    })
  } else if (action === "resume") {
    if (membership.status !== "PAUSED") {
      return NextResponse.json({ error: "Only paused memberships can be resumed" }, { status: 400 })
    }
    await prisma.membership.update({
      where: { id: params.id },
      data: { status: "ACTIVE" },
    })
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
