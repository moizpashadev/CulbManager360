import { SignJWT, jwtVerify } from "jose"

export interface JwtPayload {
  sub: string        // staffId or superAdminId
  tenantId: string   // "__super__" for super admins
  tenantName: string // gym name or "Club Manager 360"
  role: string
  firstName: string
  lastName: string
  moduleGym: boolean
  moduleCourts: boolean
}

function getSecret() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET ?? "change-this-secret-in-production-min-32-chars!!"
  )
}

const COOKIE_NAME = "cm360_token"
const EXPIRES_IN = "7d"

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as JwtPayload
  } catch {
    return null
  }
}

export { COOKIE_NAME }
