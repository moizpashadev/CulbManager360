import { cookies } from "next/headers"
import { verifyMemberToken, MEMBER_COOKIE_NAME, type MemberJwtPayload } from "./jwt"

// Call this in Server Components and API routes to get the logged-in member.
// Returns null if not authenticated.
export async function getMemberSession(): Promise<MemberJwtPayload | null> {
  const token = (await cookies()).get(MEMBER_COOKIE_NAME)?.value
  if (!token) return null
  return verifyMemberToken(token)
}
