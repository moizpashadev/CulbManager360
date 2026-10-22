import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { verifyOtpCode } from "@/lib/member-auth/otp"
import { signMemberToken, MEMBER_COOKIE_NAME } from "@/lib/member-auth/jwt"

export async function POST(request: NextRequest) {
  const { email, code } = await request.json()

  if (!email || typeof email !== "string" || !code || typeof code !== "string") {
    return NextResponse.json({ error: "Email and code are required" }, { status: 400 })
  }

  const lowerEmail = email.toLowerCase()
  const now = new Date()
  const invalidResponse = () =>
    NextResponse.json({ error: "Invalid or expired code" }, { status: 401 })

  const otp = await prisma.memberOtp.findFirst({
    where: { email: lowerEmail, consumedAt: null, expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
  })
  if (!otp) return invalidResponse()

  const valid = await verifyOtpCode(code, otp.codeHash)
  if (!valid) return invalidResponse()

  await prisma.memberOtp.update({
    where: { id: otp.id },
    data: { consumedAt: now },
  })

  // First successful verify for an email doubles as signup.
  const account = await prisma.memberAccount.upsert({
    where: { email: lowerEmail },
    update: {},
    create: { email: lowerEmail },
  })

  const gymLinks = await prisma.memberGymLink.findMany({
    where: { accountId: account.id },
    include: { tenant: { select: { name: true, slug: true } } },
    orderBy: { joinedAt: "desc" },
  })

  const token = await signMemberToken({ sub: account.id, email: account.email })

  const response = NextResponse.json({
    ok: true,
    redirect: "/portal",
    gymLinks: gymLinks.map((l) => ({
      tenantName: l.tenant.name,
      tenantSlug: l.tenant.slug,
      status: l.status,
      joinedAt: l.joinedAt,
      leftAt: l.leftAt,
    })),
  })
  response.cookies.set(MEMBER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })
  return response
}
