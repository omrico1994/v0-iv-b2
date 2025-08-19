"use server"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user"
import { revalidatePath } from "next/cache"

export interface UserWithDetails {
  id: string
  email: string
  created_at: string
  user_metadata: any
  user_profiles: {
    first_name: string
    last_name: string
    phone?: string
    is_active: boolean
    business_setup_completed: boolean
    created_at: string
  }
  user_roles: Array<{
    role: string
    retailer_id?: string
    retailers?: {
      id: string
      name: string
      business_name: string
    }
  }>
  user_location_memberships: Array<{
    location_id: string
    is_active: boolean
    locations: {
      id: string
      name: string
      retailers: {
        business_name: string
      }
    }
  }>
  user_invitations: Array<{
    status: string
    sent_at?: string
    accepted_at?: string
  }>
}

export async function getAllUsers(filters?: {
  role?: string
  retailerId?: string
  status?: "active" | "inactive"
  search?: string
}) {
  try {
    const supabase = createServiceClient()
    if (!supabase) {
      return { error: "Service client not configured" }
    }

    const currentUser = await getCurrentUser()

    if (!currentUser || !["admin", "office"].includes(currentUser.role)) {
      return { error: "Unauthorized to view users" }
    }

    // Get all users from Supabase Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      return { error: "Failed to fetch users from auth" }
    }

    // Get user profiles and roles
    let profileQuery = supabase.from("user_profiles").select(`
        *,
        user_roles (
          role,
          retailer_id,
          retailers (
            id,
            name,
            business_name
          )
        ),
        user_location_memberships (
          location_id,
          is_active,
          locations (
            id,
            name,
            retailers (
              business_name
            )
          )
        ),
        user_invitations (
          status,
          sent_at,
          accepted_at
        )
      `)

    // Apply filters
    if (filters?.status === "active") {
      profileQuery = profileQuery.eq("is_active", true)
    } else if (filters?.status === "inactive") {
      profileQuery = profileQuery.eq("is_active", false)
    }

    const { data: profiles, error: profileError } = await profileQuery

    if (profileError) {
      return { error: "Failed to fetch user profiles" }
    }

    // Combine auth users with profiles
    const users: UserWithDetails[] = authUsers.users
      .map((authUser) => {
        const profile = profiles?.find((p) => p.id === authUser.id)
        if (!profile) return null

        return {
          id: authUser.id,
          email: authUser.email || "",
          created_at: authUser.created_at,
          user_metadata: authUser.user_metadata,
          user_profiles: profile,
          user_roles: profile.user_roles || [],
          user_location_memberships: profile.user_location_memberships || [],
          user_invitations: profile.user_invitations || [],
        }
      })
      .filter(Boolean) as UserWithDetails[]

    // Apply additional filters
    let filteredUsers = users

    if (filters?.role) {
      filteredUsers = filteredUsers.filter((user) => user.user_roles.some((role) => role.role === filters.role))
    }

    if (filters?.retailerId) {
      filteredUsers = filteredUsers.filter((user) =>
        user.user_roles.some((role) => role.retailer_id === filters.retailerId),
      )
    }

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase()
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm) ||
          user.user_profiles.first_name.toLowerCase().includes(searchTerm) ||
          user.user_profiles.last_name.toLowerCase().includes(searchTerm),
      )
    }

    return { success: true, users: filteredUsers }
  } catch (error) {
    console.error("Error fetching users:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function updateUserProfile(
  userId: string,
  updates: {
    firstName?: string
    lastName?: string
    phone?: string
  },
) {
  try {
    const supabase = createServiceClient()
    if (!supabase) {
      return { error: "Service client not configured" }
    }

    const currentUser = await getCurrentUser()

    if (!currentUser || !["admin", "office"].includes(currentUser.role)) {
      return { error: "Unauthorized to update users" }
    }

    // Get current profile for audit trail
    const { data: currentProfile } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

    // Update profile
    const updateData: any = {}
    if (updates.firstName) updateData.first_name = updates.firstName
    if (updates.lastName) updateData.last_name = updates.lastName
    if (updates.phone !== undefined) updateData.phone = updates.phone || null

    const { error: updateError } = await supabase.from("user_profiles").update(updateData).eq("id", userId)

    if (updateError) {
      return { error: "Failed to update user profile" }
    }

    // Log audit trail
    await supabase.from("audit_logs").insert({
      user_id: currentUser.id,
      action: "UPDATE",
      table_name: "user_profiles",
      record_id: userId,
      old_data: currentProfile,
      new_data: updateData,
    })

    revalidatePath("/dashboard/admin/users")
    return { success: "User profile updated successfully" }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function toggleUserStatus(userId: string) {
  try {
    const supabase = createServiceClient()
    if (!supabase) {
      return { error: "Service client not configured" }
    }

    const currentUser = await getCurrentUser()

    if (!currentUser || !["admin", "office"].includes(currentUser.role)) {
      return { error: "Unauthorized to modify user status" }
    }

    // Get current status
    const { data: currentProfile } = await supabase.from("user_profiles").select("is_active").eq("id", userId).single()

    if (!currentProfile) {
      return { error: "User not found" }
    }

    // Toggle status
    const newStatus = !currentProfile.is_active
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        is_active: newStatus,
        deactivated_at: newStatus ? null : new Date().toISOString(),
        deactivated_by: newStatus ? null : currentUser.id,
      })
      .eq("id", userId)

    if (updateError) {
      return { error: "Failed to update user status" }
    }

    // Log audit trail
    await supabase.from("audit_logs").insert({
      user_id: currentUser.id,
      action: "UPDATE",
      table_name: "user_profiles",
      record_id: userId,
      old_data: { is_active: currentProfile.is_active },
      new_data: { is_active: newStatus },
    })

    revalidatePath("/dashboard/admin/users")
    return { success: `User ${newStatus ? "activated" : "deactivated"} successfully` }
  } catch (error) {
    console.error("Error toggling user status:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function updateUserRole(userId: string, newRole: string, retailerId?: string) {
  try {
    const supabase = createServiceClient()
    if (!supabase) {
      return { error: "Service client not configured" }
    }

    const currentUser = await getCurrentUser()

    if (!currentUser || !["admin", "office"].includes(currentUser.role)) {
      return { error: "Unauthorized to update user roles" }
    }

    // Get current role for audit trail
    const { data: currentRole } = await supabase.from("user_roles").select("*").eq("user_id", userId).single()

    // Update role
    const { error: updateError } = await supabase
      .from("user_roles")
      .update({
        role: newRole,
        retailer_id: retailerId || null,
      })
      .eq("user_id", userId)

    if (updateError) {
      return { error: "Failed to update user role" }
    }

    // Log audit trail
    await supabase.from("audit_logs").insert({
      user_id: currentUser.id,
      action: "UPDATE",
      table_name: "user_roles",
      record_id: userId,
      old_data: currentRole,
      new_data: { role: newRole, retailer_id: retailerId },
    })

    revalidatePath("/dashboard/admin/users")
    return { success: "User role updated successfully" }
  } catch (error) {
    console.error("Error updating user role:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function getUserAuditLogs(userId: string) {
  try {
    const supabase = createClient()
    const currentUser = await getCurrentUser()

    if (!currentUser || !["admin", "office"].includes(currentUser.role)) {
      return { error: "Unauthorized to view audit logs" }
    }

    const { data: logs, error } = await supabase
      .from("audit_logs")
      .select(`
        *,
        user_profiles!audit_logs_user_id_fkey (
          first_name,
          last_name
        )
      `)
      .or(`record_id.eq.${userId},user_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      return { error: "Failed to fetch audit logs" }
    }

    return { success: true, logs }
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    return { error: "An unexpected error occurred" }
  }
}
