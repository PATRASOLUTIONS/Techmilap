import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath =
    path === "/login" ||
    path === "/signup" ||
    path === "/forgot-password" ||
    path === "/verify-otp" ||
    path.startsWith("/events/") ||
    path === "/events" ||
    path === "/" ||
    path === "/about" ||
    path === "/contact" ||
    path === "/features" ||
    path === "/pricing" ||
    path === "/terms" ||
    path === "/privacy" ||
    path === "/cookies" ||
    path === "/gdpr"

  // Get the token from the cookies
  const token =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value

  // If the path is not public and there's no token, redirect to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If the path is login/signup and there's a token, redirect to dashboard
  if (isPublicPath && token && (path === "/login" || path === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  // This ensures the middleware runs on all paths except for API routes, static files, etc.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
