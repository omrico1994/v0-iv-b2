import { createClient } from "@/lib/supabase/server"

export interface UserWithRole {
  id: string
  email: string
  role: "admin" | "office" | "retailer" | "location_user"
  retailer_id?: string
  first_name?: string
  last_name?: string
  phone?: string
  profile_photo_url?: string
  business_setup_completed?: boolean
  email_verified_at?: string
  last_login_at?: string
  account_locked?: boolean
  locations?: Array<{
    id: string
    name: string
    retailer_id: string
  }>
}

export async function getCurrentUser(): Promise<UserWithRole | null> {
  const supabase = createClient()

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    if (user.email === "admin@iv-relife.com") {
      return {
        id: user.id,
        email: user.email,
        role: "admin",
        first_name: "Admin",
        last_name: "User",
        business_setup_completed: true,
        email_verified_at: new Date().toISOString(), // Admin is always verified
        locations: [],
      }
    }

    const { data: userRole } = await supabase
      .from("user_roles")
      .select(`
        *,
        user_profiles!inner(*)
      `)
      .eq("user_id", user.id)
      .single()

    if (!userRole || !userRole.user_profiles) {
      return null
    }

    const profile = userRole.user_profiles

    if (profile.locked_until && new Date(profile.locked_until) > new Date()) {
      return null // Account is locked
    }

    return {
      id: user.id,
      email: user.email,
      role: userRole.role,
      retailer_id: userRole.retailer_id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone,
      profile_photo_url: profile.profile_photo_url,
      business_setup_completed: profile.business_setup_completed,
      email_verified_at: profile.email_verified_at,
      last_login_at: profile.last_login_at,
      account_locked: profile.locked_until && new Date(profile.locked_until) > new Date(),
      locations: [],
    }
  } catch (error) {
    console.error("getCurrentUser error:", error)
    return null
  }
}
