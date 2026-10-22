import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import {
  generateOtpCode,
  hashOtpCode,
  OTP_EXPIRY_MINUTES,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_MAX_PER_HOUR,
} from "@/lib/member-auth/otp"
import { sendOtpEmail } from "@/lib/member-auth/send-otp-email"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 })
  }

  const lowerEmail = email.toLowerCase()
  const now = new Date()

  const recent = await prisma.memberOtp.findFirst({
    where: { email: lowerEmail },
    orderBy: { createdAt: "desc" },
  })

  if (recent) {
    const secondsSinceLast = (now.getTime() - recent.createdAt.getTime()) / 1000
    if (secondsSinceLast < OTP_RESEND_COOLDOWN_SECONDS) {
      return NextResponse.json(
        { error: `Please wait ${Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLast)}s before requesting another code` },
        { status: 429 }
      )
    }
  }

  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const countLastHour = await prisma.memberOtp.count({
    where: { email: lowerEmail, createdAt: { gte: oneHourAgo } },
  })
  if (countLastHour >= OTP_MAX_PER_HOUR) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }

  const code = generateOtpCode()
  const codeHash = await hashOtpCode(code)
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000)

  await prisma.memberOtp.create({
    data: { email: lowerEmail, codeHash, expiresAt },
  })

  await sendOtpEmail(lowerEmail, code)

  return NextResponse.json({ ok: true })
}
