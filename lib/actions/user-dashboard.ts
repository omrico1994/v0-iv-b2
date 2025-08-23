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
      console.log("[v0] Service client not configured")
      return { error: "Service client not configured" }
    }

    const currentUser = await getCurrentUser()

    if (!currentUser || !["admin", "office"].includes(currentUser.role)) {
      console.log("[v0] Unauthorized user:", currentUser?.role)
      return { error: "Unauthorized to view users" }
    }

    console.log("[v0] Fetching all users...")

    // Get all users from Supabase Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.log("[v0] Auth error:", authError)
      return { error: "Failed to fetch users from auth" }
    }

    console.log("[v0] Found auth users:", authUsers.users.length)

    let profileQuery = supabase.from("user_profiles").select("*")

    // Apply filters
    if (filters?.status === "active") {
      profileQuery = profileQuery.eq("is_active", true)
    } else if (filters?.status === "inactive") {
      profileQuery = profileQuery.eq("is_active", false)
    }

    const { data: profiles, error: profileError } = await profileQuery

    if (profileError) {
      console.log("[v0] Profile error details:", {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code,
      })
      return { error: "Failed to fetch user profiles" }
    }

    console.log("[v0] Found profiles:", profiles?.length || 0)

    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role, retailer_id")

    if (rolesError) {
      console.log("[v0] Roles error:", rolesError)
    }

    const { data: retailers, error: retailersError } = await supabase
      .from("retailers")
      .select("id, name, business_name")

    if (retailersError) {
      console.log("[v0] Retailers error:", retailersError)
    }

    const { data: locationMemberships, error: locationsError } = await supabase
      .from("user_location_memberships")
      .select("user_id, location_id, is_active")

    if (locationsError) {
      console.log("[v0] Locations error:", locationsError)
    }

    const { data: locations, error: locationsDataError } = await supabase
      .from("locations")
      .select("id, name, retailer_id")

    if (locationsDataError) {
      console.log("[v0] Locations data error:", locationsDataError)
    }

    const { data: invitations } = await supabase.from("user_invitations").select("*")

    console.log("[v0] Found invitations:", invitations?.length || 0)

    const users: UserWithDetails[] = authUsers.users.map((authUser) => {
      const profile = profiles?.find((p) => p.user_id === authUser.id)
      const userInvitations = invitations?.filter((inv) => inv.email === authUser.email) || []

      // Get user roles and combine with retailer data
      const userRoleRecords = userRoles?.filter((r) => r.user_id === authUser.id) || []
      const combinedRoles = userRoleRecords.map((role) => {
        const retailer = retailers?.find((r) => r.id === role.retailer_id)
        return {
          role: role.role,
          retailer_id: role.retailer_id,
          retailers: retailer
            ? {
                id: retailer.id,
                name: retailer.name,
                business_name: retailer.business_name,
              }
            : undefined,
        }
      })

      // Get user location memberships and combine with location data
      const userLocationRecords = locationMemberships?.filter((l) => l.user_id === authUser.id) || []
      const combinedLocations = userLocationRecords.map((membership) => {
        const location = locations?.find((l) => l.id === membership.location_id)
        const locationRetailer = retailers?.find((r) => r.id === location?.retailer_id)
        return {
          location_id: membership.location_id,
          is_active: membership.is_active,
          locations: {
            id: location?.id || membership.location_id,
            name: location?.name || "Unknown Location",
            retailers: {
              business_name: locationRetailer?.business_name || "Unknown Business",
            },
          },
        }
      })

      // Include user even if no profile exists yet
      return {
        id: authUser.id,
        email: authUser.email || "",
        created_at: authUser.created_at,
        user_metadata: authUser.user_metadata,
        user_profiles: profile || {
          first_name: authUser.user_metadata?.first_name || "Pending",
          last_name: authUser.user_metadata?.last_name || "Setup",
          phone: authUser.user_metadata?.phone || null,
          is_active: false,
          business_setup_completed: false,
          created_at: authUser.created_at,
        },
        user_roles: combinedRoles,
        user_location_memberships: combinedLocations,
        user_invitations:
          userInvitations.length > 0
            ? userInvitations.map((inv) => ({
                status: inv.accepted_at ? "accepted" : "sent",
                sent_at: inv.created_at,
                accepted_at: inv.accepted_at,
              }))
            : [
                {
                  status: "sent",
                  sent_at: authUser.created_at,
                  accepted_at: null,
                },
              ],
      }
    })

    console.log("[v0] Combined users:", users.length)

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

    console.log("[v0] Filtered users:", filteredUsers.length)
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
    console.log("[v0] Starting toggleUserStatus for userId:", userId)

    const supabase = createServiceClient()
    if (!supabase) {
      console.log("[v0] Service client not configured")
      return { error: "Service client not configured" }
    }

    const currentUser = await getCurrentUser()
    console.log("[v0] Current user:", currentUser?.email, currentUser?.role)

    if (!currentUser || !["admin", "office"].includes(currentUser.role)) {
      console.log("[v0] Unauthorized user role:", currentUser?.role)
      return { error: "Unauthorized to modify user status" }
    }

    // Get current status
    console.log("[v0] Getting current profile for userId:", userId)
    const { data: currentProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("is_active")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.log("[v0] Profile lookup error:", {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code,
      })
      return { error: `Failed to find user profile: ${profileError.message}` }
    }

    if (!currentProfile) {
      console.log("[v0] No profile found for userId:", userId)
      return { error: "User not found" }
    }

    console.log("[v0] Current profile status:", currentProfile.is_active)

    // Toggle status
    const newStatus = !currentProfile.is_active
    console.log("[v0] Updating status to:", newStatus)

    const updateData = {
      is_active: newStatus,
      deactivated_at: newStatus ? null : new Date().toISOString(),
      deactivated_by: newStatus ? null : currentUser.id,
    }

    console.log("[v0] Update data:", updateData)

    const { error: updateError, data: updateResult } = await supabase
      .from("user_profiles")
      .update(updateData)
      .eq("id", userId)
      .select()

    if (updateError) {
      console.log("[v0] Update error details:", {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
      })
      return { error: `Failed to update user status: ${updateError.message} (Code: ${updateError.code})` }
    }

    console.log("[v0] Update successful, result:", updateResult)

    // Log audit trail
    console.log("[v0] Creating audit log entry")
    const { error: auditError } = await supabase.from("audit_logs").insert({
      user_id: currentUser.id,
      action: "UPDATE",
      table_name: "user_profiles",
      record_id: userId,
      old_data: { is_active: currentProfile.is_active },
      new_data: { is_active: newStatus },
    })

    if (auditError) {
      console.log("[v0] Audit log error:", auditError)
      // Don't fail the operation for audit log issues
    }

    console.log("[v0] Revalidating path and returning success")
    revalidatePath("/dashboard/admin/users")
    return { success: `User ${newStatus ? "activated" : "deactivated"} successfully` }
  } catch (error) {
    console.error("[v0] Unexpected error in toggleUserStatus:", error)
    if (error instanceof Error) {
      return { error: `Unexpected error: ${error.message}` }
    }
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
