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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    // Get user role information
    const { data: userRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role, retailer_id")
      .eq("user_id", user.id)
      .single()

    if (roleError || !userRole) {
      return null
    }

    // Get user locations if they are a location_user
    let locations: Array<{ id: string; name: string; retailer_id: string }> = []

    if (userRole.role === "location_user") {
      const { data: userLocations } = await supabase
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

      locations = userLocations?.map((ul) => ul.locations).filter(Boolean) || []
    }

    return {
      id: user.id,
      email: user.email!,
      role: userRole.role,
      retailer_id: userRole.retailer_id,
      locations,
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}
