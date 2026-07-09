import { NextRequest, NextResponse } from "next/server"
import { ImageResponse } from "next/og"

// Edge runtime — this is next/og's primary, well-tested code path (its
// Node.js runtime bundle has been unreliable for us). Prisma can't run here,
// so member/QR data comes from the Node-runtime /card-data route instead.
export const runtime = "edge"

let fontsPromise: Promise<{ regular: ArrayBuffer; bold: ArrayBuffer }> | null = null

function loadFonts(origin: string) {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      fetch(`${origin}/fonts/DMSans-Regular.ttf`).then((r) => r.arrayBuffer()),
      fetch(`${origin}/fonts/DMSans-Bold.ttf`).then((r) => r.arrayBuffer()),
    ]).then(([regular, bold]) => ({ regular, bold }))
  }
  return fontsPromise
}

// No session check — this image is generated specifically to be handed to
// the member, who by definition has no dashboard session.
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const origin = request.nextUrl.origin

  const dataRes = await fetch(`${origin}/api/members/${params.id}/card-data`)
  if (!dataRes.ok) {
    const body = await dataRes.json().catch(() => ({}))
    return NextResponse.json(body, { status: dataRes.status })
  }
  const { memberName, tenantName, refNumber, qrDataUrl } = await dataRes.json()
  const { regular, bold } = await loadFonts(origin)

  return new ImageResponse(
    (
      <div
        style={{
          width: "640px",
          height: "1024px",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          borderRadius: "36px",
          overflow: "hidden",
          border: "2px solid #e0e0e0",
          fontFamily: "DM Sans",
        }}
      >
        {/* Header — gym branding */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "14px",
            background: "#0a8f5c",
            padding: "48px 32px 40px",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "72px",
              height: "72px",
              borderRadius: "18px",
              background: "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                border: "5px solid #ffffff",
              }}
            />
          </div>
          <div style={{ fontSize: "30px", fontWeight: 700, color: "#ffffff", textAlign: "center" }}>{tenantName}</div>
          <div style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "3px", color: "rgba(255,255,255,0.75)" }}>
            CLUB MANAGER 360
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 32px",
          }}
        >
          <div style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "2px", color: "#8a8a8a" }}>MEMBER</div>
          <div style={{ fontSize: "36px", fontWeight: 700, color: "#1a1a1a", marginTop: "6px", textAlign: "center" }}>
            {memberName}
          </div>
          <div style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "2px", color: "#8a8a8a", marginTop: "22px" }}>
            MEMBER ID
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#0a8f5c", marginTop: "2px" }}>{refNumber}</div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            width={340}
            height={340}
            style={{ marginTop: "40px", borderRadius: "20px", border: "2px solid #e0e0e0" }}
            alt=""
          />

          <div style={{ fontSize: "15px", fontWeight: 400, color: "#8a8a8a", marginTop: "28px", textAlign: "center" }}>
            Scan at the front desk to check in / check out
          </div>
        </div>
      </div>
    ),
    {
      width: 640,
      height: 1024,
      fonts: [
        { name: "DM Sans", data: regular, weight: 400, style: "normal" },
        { name: "DM Sans", data: bold, weight: 700, style: "normal" },
      ],
    }
  )
}
