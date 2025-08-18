import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse, type NextRequest } from "next/server"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

export async function updateSession(request: NextRequest) {
  // If Supabase is not configured, just continue without auth
  if (!isSupabaseConfigured) {
    return NextResponse.next({
      request,
    })
  }

  const res = NextResponse.next()

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req: request, res })

  // Check if this is an auth callback
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code)
    // Redirect to home page after successful auth
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession()

  // Define public routes that don't require authentication
  const publicRoutes = ["/auth/login", "/auth/reset-password", "/auth/update-password", "/auth/callback", "/debug/env"]

  const isPublicRoute = publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  // Protected routes - redirect to login if not authenticated
  if (!isPublicRoute) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      const redirectUrl = new URL("/auth/login", request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // If authenticated user tries to access auth pages (except update-password), redirect to home
  if (isPublicRoute && request.nextUrl.pathname !== "/auth/update-password") {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      const homeUrl = new URL("/", request.url)
      return NextResponse.redirect(homeUrl)
    }
  }

  return res
}
