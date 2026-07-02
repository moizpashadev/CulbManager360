import { NextRequest, NextResponse } from "next/server"
import { verifyToken, COOKIE_NAME } from "@/lib/auth/jwt"

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  const session = token ? await verifyToken(token) : null

  const { pathname } = request.nextUrl
  const isLogin     = pathname.startsWith("/login")
  const isDashboard = pathname.startsWith("/dashboard")
  const isAdmin     = pathname.startsWith("/admin")

  // Unauthenticated → redirect to login
  if ((isDashboard || isAdmin) && !session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Authenticated on login page → redirect to correct home
  if (isLogin && session) {
    const dest = session.role === "SUPER_ADMIN" ? "/admin" : "/dashboard"
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Super admin trying to hit /dashboard → redirect to /admin
  if (isDashboard && session?.role === "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  // Regular staff trying to hit /admin → redirect to /dashboard
  if (isAdmin && session?.role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login"],
}
