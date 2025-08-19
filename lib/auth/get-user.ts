import { createClient } from "@/lib/supabase/server"

export interface UserWithRole {
  id: string
  email: string
  role: "admin" | "office" | "retailer" | "location_user"
  retailer_id?: string
  locations?: Array<{
    id: string
    name: string
    retailer_id: string
  }>
}

export async function getCurrentUser(): Promise<UserWithRole | null> {
  const supabase = createClient()

  try {
    console.log("[v0] Getting authenticated user...")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.log("[v0] Auth error:", authError.message)
      return null
    }

    if (!user) {
      console.log("[v0] No authenticated user found")
      return null
    }

    console.log("[v0] Authenticated user found:", user.email)

    try {
      console.log("[v0] Querying user role...")
      // Get user role information
      const { data: userRole, error: roleError } = await supabase
        .from("user_roles")
        .select("role, retailer_id")
        .eq("user_id", user.id)
        .single()

      if (roleError) {
        console.log("[v0] Role query error:", roleError.message)
        // If table doesn't exist, throw a more specific error
        if (roleError.message.includes("relation") || roleError.message.includes("does not exist")) {
          throw new Error(`Database table 'user_roles' does not exist. Please run the database setup scripts.`)
        }
        return null
      }

      if (!userRole) {
        console.log("[v0] No role found for user")
        return null
      }

      console.log("[v0] User role found:", userRole.role)

      // Get user locations if they are a location_user
      let locations: Array<{ id: string; name: string; retailer_id: string }> = []

      if (userRole.role === "location_user") {
        console.log("[v0] Querying user locations...")
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

        if (locationError) {
          console.log("[v0] Location query error:", locationError.message)
          // Don't fail completely if locations can't be loaded
        } else {
          locations = userLocations?.map((ul) => ul.locations).filter(Boolean) || []
          console.log("[v0] User locations found:", locations.length)
        }
      }

      return {
        id: user.id,
        email: user.email!,
        role: userRole.role,
        retailer_id: userRole.retailer_id,
        locations,
      }
    } catch (dbError) {
      console.error("[v0] Database error in getCurrentUser:", dbError)
      throw dbError // Re-throw to be handled by the layout
    }
  } catch (error) {
    console.error("[v0] Error getting current user:", error)
    throw error // Re-throw to be handled by the layout
  }
}
