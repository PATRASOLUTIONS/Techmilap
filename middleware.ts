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
]

// Define paths that require super-admin role
const superAdminPaths = ["/super-admin", "/super-admin/users", "/super-admin/events", "/super-admin/settings"]

// Define paths that require event-planner role
const eventPlannerPaths = [
  "/dashboard",
  "/dashboard/events/create",
  "/create-event",
  "/event-dashboard",
  "/settings/email-templates",
  "/settings/email-designs",
  "/settings/email-history",
  "/event-reviews",
]

// Define paths for regular users
const userPaths = [
  "/user-dashboard",
  "/my-tickets",
  "/my-reviews",
  "/profile",
  "/settings",
  "/explore",
  "/my-events",
  "/past-events",
]

// Define shared paths that both event planners and regular users can access
const sharedPaths = ["/my-events", "/past-events", "/explore", "/profile", "/settings", "/my-tickets", "/my-reviews"]

// Function to check if a path starts with any of the given prefixes
function pathStartsWith(path: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Add security headers to all responses
  const response = NextResponse.next()
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

  // Allow access to static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".") ||
    pathname.startsWith("/api/seed") ||
    pathname.startsWith("/api/debug")
  ) {
    return response
  }

  // Check if the path is public
  const isPublicPath =
    pathStartsWith(pathname, publicPaths) ||
    pathname.startsWith("/api/public/") ||
    (pathname.startsWith("/api/events/") && (pathname.includes("/public") || pathname.includes("/register")))

  // If it's a public path, allow access
  if (isPublicPath) {
    return response
  }

  // For protected paths, check for authentication
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  // If no token and trying to access a protected route, redirect to login
  if (!token) {
    console.log("No token found, redirecting to login")
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", encodeURIComponent(request.url))
    return NextResponse.redirect(url)
  }

  // Log the token role for debugging
  console.log(`Token found with role: ${token.role || "no role"}`)

  // If user is already authenticated and trying to access login/signup pages, redirect based on role
  if (token && (pathname === "/login" || pathname === "/signup")) {
    const role = (token.role as string) || "user"
    console.log(`Redirecting authenticated user with role ${role} from login/signup`)

    if (role === "super-admin") {
      return NextResponse.redirect(new URL("/super-admin", request.url))
    } else if (role === "event-planner") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    } else {
      return NextResponse.redirect(new URL("/user-dashboard", request.url))
    }
  }

  // Check for shared paths that both event planners and regular users can access
  if (pathStartsWith(pathname, sharedPaths)) {
    return response
  }

  // Check for super-admin routes
  if (pathStartsWith(pathname, superAdminPaths) && token.role !== "super-admin") {
    // Redirect non-super-admins based on their role
    if (token.role === "event-planner") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    } else {
      return NextResponse.redirect(new URL("/user-dashboard", request.url))
    }
  }

  // Check for event-planner routes
  if (pathStartsWith(pathname, eventPlannerPaths) && token.role !== "event-planner" && token.role !== "super-admin") {
    return NextResponse.redirect(new URL("/user-dashboard", request.url))
  }

  // Check for user routes
  if (pathStartsWith(pathname, userPaths) && token.role !== "user" && !pathStartsWith(pathname, sharedPaths)) {
    if (token.role === "event-planner" || token.role === "super-admin") {
      // Allow event planners and super admins to access user routes
      return response
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // For any other authenticated routes, allow access
  return response
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
