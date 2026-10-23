import { NextRequest, NextResponse } from "next/server"
import { verifyToken, COOKIE_NAME } from "@/lib/auth/jwt"
import { verifyMemberToken, MEMBER_COOKIE_NAME } from "@/lib/member-auth/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Me360 entry point — the shareable/marketing URL for the member app.
  // Accept any case (QR codes, printed material, etc. won't always be
  // lowercase) and always normalize to lowercase before routing onward.
  if (pathname.toLowerCase() === "/me360") {
    if (pathname !== "/me360") {
      return NextResponse.redirect(new URL("/me360", request.url))
    }
    const memberToken = request.cookies.get(MEMBER_COOKIE_NAME)?.value
    const memberSession = memberToken ? await verifyMemberToken(memberToken) : null
    return NextResponse.redirect(new URL(memberSession ? "/portal" : "/member-login", request.url))
  }

  const isLogin     = pathname.startsWith("/login")
  const isDashboard = pathname.startsWith("/dashboard")
  const isAdmin     = pathname.startsWith("/admin")
  const isMemberLogin = pathname.startsWith("/member-login")
  const isPortal       = pathname.startsWith("/portal")

  // ── Staff/super-admin auth (unchanged) ──────────────────────────────────
  if (isLogin || isDashboard || isAdmin) {
    const token = request.cookies.get(COOKIE_NAME)?.value
    const session = token ? await verifyToken(token) : null

    if ((isDashboard || isAdmin) && !session) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    if (isLogin && session) {
      const dest = session.role === "SUPER_ADMIN" ? "/admin" : "/dashboard"
      return NextResponse.redirect(new URL(dest, request.url))
    }
    if (isDashboard && session?.role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
    if (isAdmin && session?.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return NextResponse.next()
  }

  // ── Member auth (separate session/cookie) ───────────────────────────────
  if (isMemberLogin || isPortal) {
    const memberToken = request.cookies.get(MEMBER_COOKIE_NAME)?.value
    const memberSession = memberToken ? await verifyMemberToken(memberToken) : null

    if (isPortal && !memberSession) {
      return NextResponse.redirect(new URL("/member-login", request.url))
    }
    if (isMemberLogin && memberSession) {
      return NextResponse.redirect(new URL("/portal", request.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*", "/admin/:path*", "/login", "/portal/:path*", "/member-login",
    // Next.js matchers are literal/case-sensitive — list the capitalization
    // the Me360 decision doc explicitly calls out ("redirect from /Me360").
    // The middleware body also lowercases defensively for any other casing
    // that happens to hit one of these two matched paths.
    "/me360", "/Me360",
  ],
}
