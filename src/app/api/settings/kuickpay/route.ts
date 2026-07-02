import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!["OWNER", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { kuickpayInstitutionId } = await req.json()

  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: { kuickpayInstitutionId: kuickpayInstitutionId || null },
  })

  return NextResponse.json({ ok: true })
}
