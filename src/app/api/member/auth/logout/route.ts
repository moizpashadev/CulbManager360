import { NextResponse } from "next/server"
import { MEMBER_COOKIE_NAME } from "@/lib/member-auth/jwt"

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete(MEMBER_COOKIE_NAME)
  return response
}
