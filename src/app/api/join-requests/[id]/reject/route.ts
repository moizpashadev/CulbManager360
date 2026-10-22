import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, props: Params) {
  const params = await props.params
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const joinRequest = await prisma.memberJoinRequest.findFirst({
    where: { id: params.id, tenantId: session.tenantId, status: "PENDING" },
  })
  if (!joinRequest) return NextResponse.json({ error: "Request not found" }, { status: 404 })

  await prisma.memberJoinRequest.update({
    where: { id: joinRequest.id },
    data: { status: "REJECTED", resolvedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
