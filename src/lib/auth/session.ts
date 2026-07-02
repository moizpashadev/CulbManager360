import { cookies } from "next/headers"
import { verifyToken, COOKIE_NAME, type JwtPayload } from "./jwt"

// Call this in Server Components and API routes to get the logged-in user.
// Returns null if not authenticated.
export async function getSession(): Promise<JwtPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}
