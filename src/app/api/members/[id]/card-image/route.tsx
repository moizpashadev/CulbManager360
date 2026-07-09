import { NextRequest, NextResponse } from "next/server"
import { ImageResponse } from "next/og"
import QRCode from "qrcode"
import { readFileSync } from "fs"
import path from "path"
import { prisma } from "@/lib/db/prisma"

export const runtime = "nodejs"

const fontRegular = readFileSync(path.join(process.cwd(), "src/assets/fonts/DMSans-Regular.ttf"))
const fontBold = readFileSync(path.join(process.cwd(), "src/assets/fonts/DMSans-Bold.ttf"))

// No session check — same reasoning as /api/members/[id]/qr: this is
// generated specifically to be sent to the member, who has no session.
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const member = await prisma.member.findUnique({
    where: { id: params.id },
    include: { tenant: { select: { name: true } } },
  })
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })

  const qrDataUrl = await QRCode.toDataURL(`CM360:${member.id}`, { width: 500, margin: 1 })
  const refNumber = member.consumerNumber ?? member.id.slice(-8).toUpperCase()

  return new ImageResponse(
    (
      <div
        style={{
          width: "1020px",
          height: "640px",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          borderRadius: "36px",
          overflow: "hidden",
          border: "2px solid #e0e0e0",
          fontFamily: "DM Sans",
        }}
      >
        {/* Header strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            background: "#0a8f5c",
            padding: "28px 40px",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                width: "22px",
                height: "22px",
                borderRadius: "6px",
                border: "4px solid #ffffff",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "34px", fontWeight: 700, color: "#ffffff" }}>{member.tenant.name}</div>
            <div style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "3px", color: "rgba(255,255,255,0.75)" }}>
              CLUB MANAGER 360
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "space-between", padding: "32px 40px" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "2px", color: "#8a8a8a" }}>MEMBER</div>
            <div style={{ fontSize: "44px", fontWeight: 700, color: "#1a1a1a", marginTop: "4px" }}>
              {member.firstName} {member.lastName}
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "2px", color: "#8a8a8a", marginTop: "28px" }}>
              MEMBER ID
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#0a8f5c", marginTop: "2px" }}>{refNumber}</div>
            <div style={{ fontSize: "16px", fontWeight: 400, color: "#8a8a8a", marginTop: "24px" }}>
              Scan at the front desk to check in / check out
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} width={280} height={280} style={{ borderRadius: "16px", border: "2px solid #e0e0e0" }} alt="" />
        </div>
      </div>
    ),
    {
      width: 1020,
      height: 640,
      fonts: [
        { name: "DM Sans", data: fontRegular, weight: 400, style: "normal" },
        { name: "DM Sans", data: fontBold, weight: 700, style: "normal" },
      ],
    }
  )
}
