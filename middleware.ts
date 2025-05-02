import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Define public paths that don't require authentication
  const publicPaths = [
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/verify-otp",
    "/api/auth",
    "/events",
    "/my-events/details", // Make event details publicly accessible
    "/public-events",
    "/about",
    "/contact",
    "/features",
    "/pricing",
    "/terms",
    "/privacy",
    "/cookies",
    "/gdpr",
    "/event-terms",
  ]

  // Check if the path is public or starts with a public path
  const isPublicPath = publicPaths.some(
    (path) =>
      pathname === path ||
      pathname.startsWith(`${path}/`) ||
      (pathname.startsWith("/api/events/") && (pathname.includes("/public") || pathname.includes("/register"))),
  )

  // Allow access to static files and favicon
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".") ||
    pathname.startsWith("/api/seed")
  ) {
    return NextResponse.next()
  }

  // If it's a public path, allow access
  if (isPublicPath) {
    return NextResponse.next()
  }

  // For protected paths, check for authentication
  const token = await getToken({ req: request })

  // If no token and trying to access a protected route, redirect to login
  if (!token) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", encodeURI(request.url))
    return NextResponse.redirect(url)
  }

  // Check for super-admin routes
  if (pathname.startsWith("/super-admin") && token.role !== "super-admin") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
