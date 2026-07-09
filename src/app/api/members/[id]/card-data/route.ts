import { NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"
import { prisma } from "@/lib/db/prisma"

// Node.js-runtime route: Prisma needs Node (not Edge). Returns plain JSON so
// the Edge-runtime card-image route can render the PNG without needing
// Prisma itself.
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const member = await prisma.member.findUnique({
    where: { id: params.id },
    include: { tenant: { select: { name: true } } },
  })
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })

  const qrDataUrl = await QRCode.toDataURL(`CM360:${member.id}`, { width: 500, margin: 1 })
  const refNumber = member.consumerNumber ?? member.id.slice(-8).toUpperCase()

  return NextResponse.json({
    memberName: `${member.firstName} ${member.lastName}`,
    tenantName: member.tenant.name,
    refNumber,
    qrDataUrl,
  })
}
