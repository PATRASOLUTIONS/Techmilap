import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // The middleware doesn't need to do anything special for 404s
  // Next.js will automatically use the not-found.tsx file
  return NextResponse.next()
}

export const config = {
  // This ensures the middleware runs on all paths
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
