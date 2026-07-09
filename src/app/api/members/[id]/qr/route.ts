import { NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"
import { prisma } from "@/lib/db/prisma"

// No session check — this image is meant to be handed to the member
// themselves (WhatsApp share, printed card), who by definition has no
// dashboard session. It only encodes the member's own ID, which enables
// nothing beyond what a front-desk scan (itself staff-authenticated) allows.
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const member = await prisma.member.findUnique({
    where: { id: params.id },
    select: { id: true },
  })
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })

  const payload = `CM360:${member.id}`
  const png = await QRCode.toBuffer(payload, { width: 320, margin: 2 })

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=3600",
    },
  })
}
