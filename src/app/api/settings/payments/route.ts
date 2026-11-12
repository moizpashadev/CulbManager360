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

  const { kuickpayInstitutionId, paymentLinkEnabled, paymentLinkTemplate } = await req.json()

  if (paymentLinkEnabled && (!paymentLinkTemplate || !String(paymentLinkTemplate).includes("{cn}"))) {
    return NextResponse.json({ error: 'paymentLinkTemplate must contain "{cn}"' }, { status: 400 })
  }

  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: {
      ...(kuickpayInstitutionId !== undefined && { kuickpayInstitutionId: kuickpayInstitutionId || null }),
      ...(paymentLinkEnabled !== undefined && { paymentLinkEnabled }),
      ...(paymentLinkTemplate !== undefined && { paymentLinkTemplate: paymentLinkTemplate || null }),
    },
  })

  return NextResponse.json({ ok: true })
}
