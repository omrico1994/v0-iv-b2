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

    console.log("[v0] Fetching all users with optimized query...")

    // Single optimized query using joins instead of multiple separate queries
    let profileQuery = supabase.from("user_profiles").select(`
        id,
        first_name,
        last_name,
        phone,
        is_active,
        business_setup_completed,
        created_at,
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

    // Apply filters at database level for better performance
    if (filters?.status === "active") {
      profileQuery = profileQuery.eq("is_active", true)
    } else if (filters?.status === "inactive") {
      profileQuery = profileQuery.eq("is_active", false)
    }

    if (filters?.role) {
      profileQuery = profileQuery.eq("user_roles.role", filters.role)
    }

    if (filters?.retailerId) {
      profileQuery = profileQuery.eq("user_roles.retailer_id", filters.retailerId)
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

    // Get auth users - this is still needed for email and metadata
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.log("[v0] Auth error:", authError)
      return { error: "Failed to fetch users from auth" }
    }

    console.log("[v0] Found auth users:", authUsers.users.length)

    // Combine auth data with profile data (much more efficient than before)
    const users: UserWithDetails[] = authUsers.users.map((authUser) => {
      const profile = profiles?.find((p) => p.id === authUser.id)

      if (!profile) {
        // Handle users without profiles (pending setup)
        return {
          id: authUser.id,
          email: authUser.email || "",
          created_at: authUser.created_at,
          user_metadata: authUser.user_metadata,
          user_profiles: {
            first_name: authUser.user_metadata?.first_name || "Pending",
            last_name: authUser.user_metadata?.last_name || "Setup",
            phone: authUser.user_metadata?.phone || null,
            is_active: false,
            business_setup_completed: false,
            created_at: authUser.created_at,
          },
          user_roles: [],
          user_location_memberships: [],
          user_invitations: [
            {
              status: "sent",
              sent_at: authUser.created_at,
              accepted_at: null,
            },
          ],
        }
      }

      // Transform the joined data structure
      return {
        id: authUser.id,
        email: authUser.email || "",
        created_at: authUser.created_at,
        user_metadata: authUser.user_metadata,
        user_profiles: {
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          is_active: profile.is_active,
          business_setup_completed: profile.business_setup_completed,
          created_at: profile.created_at,
        },
        user_roles: profile.user_roles || [],
        user_location_memberships: profile.user_location_memberships || [],
        user_invitations:
          profile.user_invitations?.length > 0
            ? profile.user_invitations.map((inv) => ({
                status: inv.accepted_at ? "accepted" : "sent",
                sent_at: inv.sent_at,
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

    // Apply search filter (only if needed, to avoid unnecessary processing)
    let filteredUsers = users
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
