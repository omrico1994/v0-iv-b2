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
    console.log("[v0] getCurrentUser: Starting authentication check")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.log("[v0] getCurrentUser: Auth error:", authError)
      return null
    }

    if (!user) {
      console.log("[v0] getCurrentUser: No authenticated user")
      return null
    }

    console.log("[v0] getCurrentUser: Authenticated user found:", user.id)

    try {
      console.log("[v0] getCurrentUser: Querying user_profiles table")
      // First get user profile
      const { data: userProfile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single()

      if (profileError) {
        console.log("[v0] getCurrentUser: Profile error:", profileError)
        if (profileError.message.includes("relation") || profileError.message.includes("does not exist")) {
          throw new Error(`Database table 'user_profiles' does not exist. Please run the database setup scripts.`)
        }
        if (profileError.code === "PGRST116") {
          console.log("[v0] getCurrentUser: No profile found for user")
          return null
        }
        return null
      }

      console.log("[v0] getCurrentUser: Profile found:", userProfile)

      console.log("[v0] getCurrentUser: Querying user_roles table")
      // Get user role
      const { data: userRole, error: roleError } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (roleError || !userRole) {
        console.log("[v0] getCurrentUser: Role error or no role:", roleError)
        return null
      }

      console.log("[v0] getCurrentUser: Role found:", userRole)

      // Get user locations if they are a location_user
      let locations: Array<{ id: string; name: string; retailer_id: string }> = []

      if (userRole.role === "location_user") {
        console.log("[v0] getCurrentUser: Querying locations for location_user")
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
          console.log("[v0] getCurrentUser: Locations found:", locations)
        }
      }

      const result = {
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

      console.log("[v0] getCurrentUser: Returning user data:", result)
      return result
    } catch (dbError) {
      console.log("[v0] getCurrentUser: Database error:", dbError)
      throw dbError // Re-throw to be handled by the layout
    }
  } catch (error) {
    console.log("[v0] getCurrentUser: General error:", error)
    throw error // Re-throw to be handled by the layout
  }
}
