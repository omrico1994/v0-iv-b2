import { createClient, createServiceClient } from "@/lib/supabase/server"

export interface UserWithRole {
  id: string
  email: string
  role: string | null
  retailerId?: string | null
  locationId?: string | null
  subRole?: string | null
}

// Get current user with role information
export async function getCurrentUser(): Promise<UserWithRole | null> {
  const supabase = createClient()
  if (!supabase) return null

  try {
    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return null
    }

    // Use service client to get role data (bypasses RLS)
    const serviceClient = createServiceClient()
    if (!serviceClient) {
      return {
        id: user.id,
        email: user.email!,
        role: null,
      }
    }

    // Query user role using service client
    const { data: roleData, error: roleError } = await serviceClient
      .from("user_roles")
      .select("role, retailer_id, location_id, sub_role")
      .eq("user_id", user.id)
      .single()

    if (roleError || !roleData) {
      return {
        id: user.id,
        email: user.email!,
        role: null,
      }
    }

    return {
      id: user.id,
      email: user.email!,
      role: roleData.role,
      retailerId: roleData.retailer_id,
      locationId: roleData.location_id,
      subRole: roleData.sub_role,
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

// Check if user is authenticated
export async function getUser() {
  const supabase = createClient()
  if (!supabase) return null

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    return error ? null : user
  } catch (error) {
    return null
  }
}
