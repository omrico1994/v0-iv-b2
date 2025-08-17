import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const { pathname } = req.nextUrl

  const supabase = createMiddlewareClient(
    { req, res },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
  )

  // Create service role client for role queries (bypasses RLS)
  const serviceSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Public routes that don't require authentication
  const publicRoutes = ["/auth/login", "/auth/reset-password", "/auth/update-password", "/debug/env"]
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // If no session and trying to access protected route, redirect to login
  if (!session && !isPublicRoute) {
    const loginUrl = new URL("/auth/login", req.url)
    return NextResponse.redirect(loginUrl)
  }

  // If session exists and trying to access auth pages, check role and redirect
  if (session && isPublicRoute && pathname !== "/auth/update-password") {
    try {
      // Query user role using service role (bypasses RLS)
      const { data: roleData, error: roleError } = await serviceSupabase
        .from("user_roles")
        .select("role, retailer_id, location_id, sub_role")
        .eq("user_id", session.user.id)
        .maybeSingle()

      if (roleError) {
        console.error("[Middleware] Role query error:", roleError)
        // If role query fails, redirect to access pending
        const homeUrl = new URL("/", req.url)
        return NextResponse.redirect(homeUrl)
      }

      if (roleData?.role) {
        // User has role, redirect to appropriate dashboard
        const dashboardUrl = new URL(`/dashboard/${roleData.role}`, req.url)
        return NextResponse.redirect(dashboardUrl)
      } else {
        // User has no role, redirect to access pending
        const homeUrl = new URL("/", req.url)
        return NextResponse.redirect(homeUrl)
      }
    } catch (error) {
      console.error("[Middleware] Error checking user role:", error)
      const homeUrl = new URL("/", req.url)
      return NextResponse.redirect(homeUrl)
    }
  }

  // Handle dashboard route access
  if (session && pathname.startsWith("/dashboard/")) {
    const roleFromPath = pathname.split("/")[2]

    try {
      // Verify user has access to this role's dashboard
      const { data: roleData, error: roleError } = await serviceSupabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle()

      if (roleError || !roleData?.role) {
        // No role found, redirect to access pending
        const homeUrl = new URL("/", req.url)
        return NextResponse.redirect(homeUrl)
      }

      if (roleData.role !== roleFromPath) {
        // User trying to access wrong dashboard, redirect to correct one
        const correctDashboardUrl = new URL(`/dashboard/${roleData.role}`, req.url)
        return NextResponse.redirect(correctDashboardUrl)
      }
    } catch (error) {
      console.error("[Middleware] Error verifying dashboard access:", error)
      const homeUrl = new URL("/", req.url)
      return NextResponse.redirect(homeUrl)
    }
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
}
