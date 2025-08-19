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
      // Get user profile and role information in a single query
      const { data: userData, error: userError } = await supabase
        .from("user_profiles")
        .select(`
          first_name,
          last_name,
          phone,
          profile_photo_url,
          business_setup_completed,
          user_roles (
            role,
            retailer_id
          )
        `)
        .eq("user_id", user.id)
        .single()

      if (userError) {
        // If table doesn't exist, throw a more specific error
        if (userError.message.includes("relation") || userError.message.includes("does not exist")) {
          throw new Error(`Database table 'user_profiles' does not exist. Please run the database setup scripts.`)
        }

        if (userError.code === "PGRST116") {
          return null
        }

        return null
      }

      if (!userData || !userData.user_roles) {
        return null
      }

      const userRole = userData.user_roles

      // Get user locations if they are a location_user
      let locations: Array<{ id: string; name: string; retailer_id: string }> = []

      if (userRole.role === "location_user") {
        const { data: userLocations, error: locationError } = await supabase
          .from("user_location_memberships")
          .select(`
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
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
        profile_photo_url: userData.profile_photo_url,
        business_setup_completed: userData.business_setup_completed,
        locations,
      }
    } catch (dbError) {
      throw dbError // Re-throw to be handled by the layout
    }
  } catch (error) {
    throw error // Re-throw to be handled by the layout
  }
}
