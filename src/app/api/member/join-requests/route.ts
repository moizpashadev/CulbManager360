import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getMemberSession } from "@/lib/member-auth/session"

export async function POST(request: NextRequest) {
  const session = await getMemberSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { tenantId, firstName, lastName, phone, message } = await request.json()
  if (!tenantId || !firstName || !lastName) {
    return NextResponse.json({ error: "tenantId, firstName and lastName are required" }, { status: 400 })
  }

  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId, isActive: true } })
  if (!tenant) return NextResponse.json({ error: "Gym not found" }, { status: 404 })

  const alreadyLinked = await prisma.memberGymLink.findFirst({
    where: { accountId: session.sub, tenantId, status: "ACTIVE" },
  })
  if (alreadyLinked) {
    return NextResponse.json({ error: "You're already a member of this gym" }, { status: 409 })
  }

  try {
    const joinRequest = await prisma.memberJoinRequest.create({
      data: { accountId: session.sub, tenantId, firstName, lastName, phone: phone || null, message: message || null },
    })
    return NextResponse.json(joinRequest, { status: 201 })
  } catch {
    return NextResponse.json({ error: "You already have a pending request for this gym" }, { status: 409 })
  }
}
