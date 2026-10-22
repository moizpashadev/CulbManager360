import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getMemberSession } from "@/lib/member-auth/session"

export async function POST(request: NextRequest) {
  const session = await getMemberSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { endpoint, keys } = await request.json()
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
  }

  await prisma.memberPushSubscription.upsert({
    where: { endpoint },
    update: { accountId: session.sub, p256dh: keys.p256dh, auth: keys.auth },
    create: { accountId: session.sub, endpoint, p256dh: keys.p256dh, auth: keys.auth },
  })

  return NextResponse.json({ ok: true })
}
