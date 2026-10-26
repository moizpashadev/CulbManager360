import { SignJWT, jwtVerify } from "jose"

// Separate token/cookie scope from staff auth (src/lib/auth/jwt.ts) — a
// member session must never be mistaken for a staff session, so this is
// deliberately a distinct payload shape, cookie name, and verify function,
// even though it reuses JWT_SECRET for simplicity.
export interface MemberJwtPayload {
  sub: string   // MemberAccount.id
  email: string
  iat?: number
  exp?: number
}

function getSecret() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET ?? "change-this-secret-in-production-min-32-chars!!"
  )
}

const COOKIE_NAME = "cm360_member_token"

// Long-lived on purpose: members log in with OTP only (no password), so
// re-authenticating is real friction, not a quick re-type. A year is long
// enough that an active member never sees it expire. middleware.ts slides
// this forward on every /portal request past the halfway point, so a
// member who opens the app at least once a year effectively never logs
// out — each device/browser gets its own independent cookie and renewal,
// so this already covers "stay logged in on multiple devices" with no
// extra device-tracking needed.
const EXPIRES_IN = "365d"
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365
const RENEW_AFTER_SECONDS = MAX_AGE_SECONDS / 2

export async function signMemberToken(payload: { sub: string; email: string }): Promise<string> {
  return new SignJWT({ sub: payload.sub, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(getSecret())
}

export async function verifyMemberToken(token: string): Promise<MemberJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as MemberJwtPayload
  } catch {
    return null
  }
}

// True once a session is past the halfway point of its life — middleware
// uses this to silently reissue the cookie so active members never hit
// the hard 365-day expiry.
export function shouldRenewMemberToken(payload: MemberJwtPayload): boolean {
  if (!payload.iat) return false
  const ageSeconds = Date.now() / 1000 - payload.iat
  return ageSeconds > RENEW_AFTER_SECONDS
}

export { COOKIE_NAME as MEMBER_COOKIE_NAME, MAX_AGE_SECONDS as MEMBER_COOKIE_MAX_AGE_SECONDS }
