import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getMemberSession } from "@/lib/member-auth/session"

export async function POST(request: NextRequest) {
  const session = await getMemberSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { endpoint } = await request.json()
  if (!endpoint) return NextResponse.json({ error: "endpoint is required" }, { status: 400 })

  await prisma.memberPushSubscription.deleteMany({ where: { endpoint, accountId: session.sub } })
  return NextResponse.json({ ok: true })
}
