import { updateSession } from "@/lib/supabase/middleware"
import { checkRateLimit, apiRateLimiter, authRateLimiter } from "@/lib/utils/rate-limiter"
import { getClientIP } from "@/lib/utils/security"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const clientIP = getClientIP(request)

  // Apply rate limiting to auth routes
  if (pathname.startsWith("/auth/") || pathname.startsWith("/api/auth/")) {
    const { success, headers } = await checkRateLimit(authRateLimiter, clientIP)

    if (!success) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      })
    }
  }

  // Apply rate limiting to API routes
  if (pathname.startsWith("/api/")) {
    const { success, headers } = await checkRateLimit(apiRateLimiter, clientIP)

    if (!success) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      })
    }
  }

  // Security headers for all requests
  const response = await updateSession(request)

  // Add security headers
  response.headers.set("X-Request-ID", crypto.randomUUID())
  response.headers.set("X-Timestamp", new Date().toISOString())

  // Prevent clickjacking
  if (!response.headers.get("X-Frame-Options")) {
    response.headers.set("X-Frame-Options", "DENY")
  }

  // Prevent MIME type sniffing
  if (!response.headers.get("X-Content-Type-Options")) {
    response.headers.set("X-Content-Type-Options", "nosniff")
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
