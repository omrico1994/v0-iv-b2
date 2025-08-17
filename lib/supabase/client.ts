import { createBrowserClient } from "@supabase/ssr"

export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase environment variables are not configured")
  }

  // Create singleton instance to prevent multiple clients
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }

  return supabaseClient
}

// Export singleton instance for convenience
export const supabase = createClient()
