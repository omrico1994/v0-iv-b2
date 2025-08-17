import { cookies } from "next/headers"
import { createServerComponentClient, createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

/**
 * Use in Server Components (e.g., app/page.tsx):
 */
export function createServerClient() {
  return createServerComponentClient(
    { cookies },
    {
      supabaseUrl: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
  )
}

/**
 * Use in Route Handlers (e.g., app/api/auth/route.ts):
 */
export function createServerRouteClient(cookiesStore?: ReturnType<typeof cookies>) {
  return createRouteHandlerClient(
    { cookies: cookiesStore ?? cookies() },
    {
      supabaseUrl: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
  )
}
