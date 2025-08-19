import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Define protected routes and their required permissions
const PROTECTED_ROUTES = {
  "/dashboard/users": ["admin", "office"],
  "/dashboard/settings": ["admin", "office"],
  "/dashboard/audit": ["admin", "office"],
  "/dashboard/retailers": ["admin", "office"],
  "/dashboard/claims": ["admin", "office"], // Claims are admin/office only
  "/dashboard/reports": ["admin", "office", "retailer"],
  "/dashboard/orders": ["admin", "office", "retailer", "location_user"],
  "/dashboard/locations": ["admin", "office", "retailer"],
  "/dashboard/my-locations": ["location_user"],
  "/dashboard/repairs": ["admin", "office", "retailer", "location_user"],
} as const

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if this is an auth callback
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/auth/login") ||
    request.nextUrl.pathname.startsWith("/auth/sign-up") ||
    request.nextUrl.pathname === "/auth/callback"

  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard")

  if (isDashboardRoute && !user) {
    const redirectUrl = new URL("/auth/login", request.url)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthRoute && user) {
    const redirectUrl = new URL("/dashboard", request.url)
    return NextResponse.redirect(redirectUrl)
  }

  if (isDashboardRoute && user) {
    // Get user role for route protection
    try {
      const { data: userRole } = await supabase.from("user_roles").select("role").eq("user_id", user.id).single()

      if (userRole) {
        const pathname = request.nextUrl.pathname

        // Check if route requires specific roles
        for (const [route, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
          if (pathname.startsWith(route)) {
            if (!allowedRoles.includes(userRole.role as any)) {
              // Redirect to dashboard with access denied message
              const redirectUrl = new URL("/dashboard?error=access_denied", request.url)
              return NextResponse.redirect(redirectUrl)
            }
            break
          }
        }
      }
    } catch (error) {
      // If we can't check role, allow access (will be handled by page-level auth)
      console.error("Role check failed in middleware:", error)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
