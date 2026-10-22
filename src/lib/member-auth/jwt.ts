import { SignJWT, jwtVerify } from "jose"

// Separate token/cookie scope from staff auth (src/lib/auth/jwt.ts) — a
// member session must never be mistaken for a staff session, so this is
// deliberately a distinct payload shape, cookie name, and verify function,
// even though it reuses JWT_SECRET for simplicity.
export interface MemberJwtPayload {
  sub: string   // MemberAccount.id
  email: string
}

function getSecret() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET ?? "change-this-secret-in-production-min-32-chars!!"
  )
}

const COOKIE_NAME = "cm360_member_token"
const EXPIRES_IN = "7d"

export async function signMemberToken(payload: MemberJwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
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

export { COOKIE_NAME as MEMBER_COOKIE_NAME }
