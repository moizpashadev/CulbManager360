import { NextRequest, NextResponse } from "next/server"
import { verifyToken, COOKIE_NAME } from "@/lib/auth/jwt"
import {
  verifyMemberToken,
  signMemberToken,
  shouldRenewMemberToken,
  MEMBER_COOKIE_NAME,
  MEMBER_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/member-auth/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Me360 entry point — the shareable/marketing URL for the member app.
  // Accept any case (QR codes, printed material, etc. won't always be
  // lowercase) and always normalize to lowercase before routing onward.
  // Preserves the query string (e.g. ?ref=... from referral links) across
  // every hop — new URL(path, request.url) alone would silently drop it.
  if (pathname.toLowerCase() === "/me360") {
    if (pathname !== "/me360") {
      const dest = new URL("/me360", request.url)
      dest.search = request.nextUrl.search
      return NextResponse.redirect(dest)
    }
    const memberToken = request.cookies.get(MEMBER_COOKIE_NAME)?.value
    const memberSession = memberToken ? await verifyMemberToken(memberToken) : null
    const dest = new URL(memberSession ? "/portal" : "/member-login", request.url)
    dest.search = request.nextUrl.search
    return NextResponse.redirect(dest)
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

    const response = NextResponse.next()
    // Sliding session: silently reissue the cookie once it's past the
    // halfway point of its life, so an active member never hits the
    // 365-day hard expiry. Each device renews its own cookie independently
    // on its own requests — nothing here ties sessions together, so this
    // is also what makes "stay logged in on multiple devices" work with no
    // extra device-tracking.
    if (isPortal && memberSession && shouldRenewMemberToken(memberSession)) {
      const fresh = await signMemberToken({ sub: memberSession.sub, email: memberSession.email })
      response.cookies.set(MEMBER_COOKIE_NAME, fresh, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: MEMBER_COOKIE_MAX_AGE_SECONDS,
        path: "/",
      })
    }
    return response
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
