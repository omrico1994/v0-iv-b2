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

    if (authError) {
      return null
    }

    if (!user) {
      return null
    }

    try {
      // First get user profile
      const { data: userProfile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single()

      if (profileError) {
        if (profileError.message.includes("relation") || profileError.message.includes("does not exist")) {
          throw new Error(`Database table 'user_profiles' does not exist. Please run the database setup scripts.`)
        }
        if (profileError.code === "PGRST116") {
          return null
        }
        return null
      }

      // Get user role
      const { data: userRole, error: roleError } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (roleError || !userRole) {
        return null
      }

      // Get user locations if they are a location_user
      let locations: Array<{ id: string; name: string; retailer_id: string }> = []

      if (userRole.role === "location_user") {
        const { data: userLocations, error: locationError } = await supabase
          .from("user_location_memberships")
          .select(`
            location_id,
            locations (
              id,
              name,
              retailer_id
            )
          `)
          .eq("user_id", user.id)
          .eq("is_active", true)

        if (!locationError && userLocations) {
          locations = userLocations.map((ul) => ul.locations).filter(Boolean)
        }
      }

      return {
        id: user.id,
        email: user.email!,
        role: userRole.role,
        retailer_id: userRole.retailer_id,
        first_name: userProfile?.first_name,
        last_name: userProfile?.last_name,
        phone: userProfile?.phone,
        profile_photo_url: userProfile?.profile_photo_url,
        business_setup_completed: userProfile?.business_setup_completed,
        locations,
      }
    } catch (dbError) {
      throw dbError // Re-throw to be handled by the layout
    }
  } catch (error) {
    throw error // Re-throw to be handled by the layout
  }
}
