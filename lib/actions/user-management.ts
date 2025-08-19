"use server"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user"
import { revalidatePath } from "next/cache"

export interface CreateUserData {
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: "admin" | "office" | "retailer" | "location_user"
  retailerId?: string
  locationIds?: string[]
  isNewRetailer?: boolean
}

export async function createUser(prevState: any, formData: FormData) {
  try {
    const supabase = createServiceClient()
    if (!supabase) {
      return { error: "Service client not configured" }
    }

    const currentUser = await getCurrentUser()

    // Check permissions
    if (!currentUser || !["admin", "office", "retailer"].includes(currentUser.role)) {
      return { error: "Unauthorized to create users" }
    }

    const userData: CreateUserData = {
      email: formData.get("email") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      phone: (formData.get("phone") as string) || undefined,
      role: formData.get("role") as CreateUserData["role"],
      retailerId: (formData.get("retailerId") as string) || undefined,
      locationIds: formData.getAll("locationIds") as string[],
      isNewRetailer: formData.get("isNewRetailer") === "true",
    }

    // Validate required fields
    if (!userData.email || !userData.firstName || !userData.lastName || !userData.role) {
      return { error: "Missing required fields" }
    }

    // Role-specific validations
    if (userData.role === "retailer" && !userData.isNewRetailer && !userData.retailerId) {
      return { error: "Must select existing retailer or create new one" }
    }

    if (userData.role === "location_user" && (!userData.retailerId || userData.locationIds.length === 0)) {
      return { error: "Location users must be assigned to retailer and locations" }
    }

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(userData.email)
    if (existingUser.user) {
      return { error: "User with this email already exists" }
    }

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      email_confirm: false, // They'll confirm via invitation
      user_metadata: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone,
        role: userData.role,
        created_by: currentUser.id,
      },
    })

    if (authError || !authUser.user) {
      return { error: authError?.message || "Failed to create user account" }
    }

    // Create user profile
    const { error: profileError } = await supabase.from("user_profiles").insert({
      id: authUser.user.id,
      first_name: userData.firstName,
      last_name: userData.lastName,
      phone: userData.phone,
      business_setup_completed: userData.role !== "retailer" || !userData.isNewRetailer,
    })

    if (profileError) {
      // Cleanup auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id)
      return { error: "Failed to create user profile" }
    }

    // Handle retailer creation
    let retailerId = userData.retailerId
    if (userData.role === "retailer" && userData.isNewRetailer) {
      const { data: retailer, error: retailerError } = await supabase
        .from("retailers")
        .insert({
          business_name: `${userData.firstName} ${userData.lastName}'s Business`,
          created_by: currentUser.id,
        })
        .select("id")
        .single()

      if (retailerError || !retailer) {
        await supabase.auth.admin.deleteUser(authUser.user.id)
        return { error: "Failed to create retailer business" }
      }
      retailerId = retailer.id
    }

    // Create user role assignment
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: authUser.user.id,
      role: userData.role,
      retailer_id: retailerId || null,
    })

    if (roleError) {
      await supabase.auth.admin.deleteUser(authUser.user.id)
      return { error: "Failed to assign user role" }
    }

    // Create location assignments for location users
    if (userData.role === "location_user" && userData.locationIds.length > 0) {
      const locationAssignments = userData.locationIds.map((locationId) => ({
        user_id: authUser.user.id,
        location_id: locationId,
      }))

      const { error: locationError } = await supabase.from("user_location_memberships").insert(locationAssignments)

      if (locationError) {
        await supabase.auth.admin.deleteUser(authUser.user.id)
        return { error: "Failed to assign user to locations" }
      }
    }

    // Send invitation email
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(userData.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/setup-account`,
    })

    if (inviteError) {
      console.error("Failed to send invitation email:", inviteError)
      // Don't fail the entire operation for email issues
    }

    // Log audit trail
    await supabase.from("audit_logs").insert({
      user_id: currentUser.id,
      action: "CREATE",
      table_name: "users",
      record_id: authUser.user.id,
      new_data: {
        email: userData.email,
        role: userData.role,
        retailer_id: retailerId,
      },
    })

    revalidatePath("/admin/users")
    return { success: "User created successfully and invitation sent" }
  } catch (error) {
    console.error("Error creating user:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function deactivateUser(userId: string) {
  try {
    const supabase = createClient()
    const currentUser = await getCurrentUser()

    if (!currentUser || !["admin", "office"].includes(currentUser.role)) {
      return { error: "Unauthorized to deactivate users" }
    }

    // Soft delete - mark as inactive
    const { error } = await supabase
      .from("user_profiles")
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
        deactivated_by: currentUser.id,
      })
      .eq("id", userId)

    if (error) {
      return { error: "Failed to deactivate user" }
    }

    // Log audit trail
    await supabase.from("audit_logs").insert({
      user_id: currentUser.id,
      action: "UPDATE",
      table_name: "user_profiles",
      record_id: userId,
      new_data: { is_active: false },
    })

    revalidatePath("/admin/users")
    return { success: "User deactivated successfully" }
  } catch (error) {
    console.error("Error deactivating user:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function resetUserPassword(userId: string) {
  try {
    const supabase = createServiceClient()
    if (!supabase) {
      return { error: "Service client not configured" }
    }

    const currentUser = await getCurrentUser()

    if (!currentUser || !["admin", "office"].includes(currentUser.role)) {
      return { error: "Unauthorized to reset passwords" }
    }

    // Get user email
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId)
    if (userError || !user.user?.email) {
      return { error: "User not found" }
    }

    // Send password reset email
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.user.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    })

    if (resetError) {
      return { error: "Failed to send password reset email" }
    }

    // Log audit trail
    await supabase.from("audit_logs").insert({
      user_id: currentUser.id,
      action: "PASSWORD_RESET",
      table_name: "users",
      record_id: userId,
      new_data: { action: "password_reset_sent" },
    })

    return { success: "Password reset email sent successfully" }
  } catch (error) {
    console.error("Error resetting password:", error)
    return { error: "An unexpected error occurred" }
  }
}
