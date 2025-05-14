import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// Define public paths that don't require authentication
const publicPaths = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/verify-otp",
  "/api/auth",
  "/events",
  "/my-events/details",
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
  "/dashboard", // Add dashboard to public paths
  "/debug", // Add debug to public paths
]

// Define paths that require super-admin role
const superAdminPaths = ["/super-admin"]

// Define paths that require event-planner role
const eventPlannerPaths = ["/dashboard/events/create", "/create-event", "/event-dashboard"]

// Function to check if a path starts with any of the given prefixes
function pathStartsWith(path: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Add security headers to all responses
  const response = NextResponse.next()

  // Add security headers
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  // Add Content-Security-Policy in production
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://*.vercel-insights.com",
    )
  }

  // Check if the path is public or starts with a public path
  const isPublicPath =
    pathStartsWith(pathname, publicPaths) ||
    pathname.startsWith("/api/public/") ||
    (pathname.startsWith("/api/events/") && (pathname.includes("/public") || pathname.includes("/register")))

  // Allow access to static files and favicon
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".") ||
    pathname.startsWith("/api/seed")
  ) {
    return response
  }

  // If it's a public path, allow access
  if (isPublicPath) {
    return response
  }

  // For protected paths, check for authentication
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  // If no token and trying to access a protected route, redirect to login
  if (!token) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", encodeURIComponent(request.url))
    return NextResponse.redirect(url)
  }

  // If user is already authenticated and trying to access login/signup pages, redirect to my-events (known path)
  if (token && (pathname === "/login" || pathname === "/signup")) {
    const role = (token.role as string) || "user"

    if (role === "super-admin") {
      return NextResponse.redirect(new URL("/super-admin", request.url))
    } else {
      // For all other roles, redirect to my-events which we know exists
      return NextResponse.redirect(new URL("/my-events", request.url))
    }
  }

  // Check for super-admin routes
  if (pathStartsWith(pathname, superAdminPaths) && token.role !== "super-admin") {
    // Redirect non-super-admins to my-events
    return NextResponse.redirect(new URL("/my-events", request.url))
  }

  // Check for event-planner routes
  if (pathStartsWith(pathname, eventPlannerPaths) && token.role !== "event-planner" && token.role !== "super-admin") {
    return NextResponse.redirect(new URL("/my-events", request.url))
  }

  // Rate limiting for API routes
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth")) {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Simple in-memory rate limiting (in a real app, use Redis or similar)
    const key = `${ip}:${userAgent}:${pathname}`

    // Check rate limit (implementation would depend on your storage solution)
    // This is a placeholder for actual rate limiting logic
    const isRateLimited = false // Replace with actual check

    if (isRateLimited) {
      return NextResponse.json({ error: "Too many requests, please try again later" }, { status: 429 })
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
