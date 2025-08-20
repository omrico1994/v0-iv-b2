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

export interface AdminCreateUserData {
  role: "admin" | "office" | "retailer" | "location_user"
  email: string
  firstName: string
  lastName: string
  phone?: string
  businessType?: "new" | "existing"
  existingRetailerId?: string
  businessName?: string
  businessAddress?: string
  businessPhone?: string
  businessEmail?: string
  website?: string
  invitationMessage?: string
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

    const { data: usersList, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) {
      return { error: "Failed to check existing users" }
    }

    const existingUser = usersList.users.find((user) => user.email === userData.email)
    if (existingUser) {
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
    const redirectUrl =
      process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
      (typeof window !== "undefined"
        ? `${window.location.origin}/auth/setup-account`
        : `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/setup-account`)

    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(userData.email, {
      redirectTo: redirectUrl,
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

export async function createUserFromAdmin(userData: AdminCreateUserData) {
  try {
    console.log("[v0] Starting user creation with data:", userData)

    const supabase = createServiceClient()
    if (!supabase) {
      console.log("[v0] Service client not configured")
      return { error: "Service client not configured" }
    }

    const currentUser = await getCurrentUser()
    console.log("[v0] Current user:", currentUser?.email, currentUser?.role)

    // Check permissions
    if (!currentUser || !["admin", "office"].includes(currentUser.role)) {
      console.log("[v0] Unauthorized user")
      return { error: "Unauthorized to create users" }
    }

    // Validate required fields
    if (!userData.email || !userData.firstName || !userData.lastName || !userData.role) {
      console.log("[v0] Missing required fields:", {
        email: !!userData.email,
        firstName: !!userData.firstName,
        lastName: !!userData.lastName,
        role: !!userData.role,
      })
      return { error: "Missing required fields" }
    }

    // Role-specific validations
    if (
      (userData.role === "retailer" || userData.role === "location_user") &&
      userData.businessType === "new" &&
      !userData.businessName
    ) {
      console.log("[v0] Missing business name for new retailer")
      return { error: "Business name is required for new retailer" }
    }

    if (
      (userData.role === "retailer" || userData.role === "location_user") &&
      userData.businessType === "existing" &&
      !userData.existingRetailerId
    ) {
      console.log("[v0] Missing existing retailer ID")
      return { error: "Must select an existing retailer" }
    }

    // Check if user already exists
    console.log("[v0] Checking if user exists:", userData.email)
    const { data: usersList, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) {
      console.log("[v0] Error checking existing users:", listError)
      return { error: "Failed to check existing users" }
    }

    const existingUser = usersList.users.find((user) => user.email === userData.email)
    if (existingUser) {
      console.log("[v0] User already exists")
      return { error: "User with this email already exists" }
    }

    // Create user in Supabase Auth
    console.log("[v0] Creating auth user")
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
      console.log("[v0] Auth user creation failed:", authError)
      return { error: authError?.message || "Failed to create user account" }
    }
    console.log("[v0] Auth user created:", authUser.user.id)

    // Create user profile
    console.log("[v0] Creating user profile")
    const { error: profileError } = await supabase.from("user_profiles").insert({
      id: authUser.user.id,
      first_name: userData.firstName,
      last_name: userData.lastName,
      phone: userData.phone,
      business_setup_completed:
        userData.role === "admin" || userData.role === "office" || userData.businessType === "existing",
    })

    if (profileError) {
      console.log("[v0] Profile creation failed:", profileError)
      // Cleanup auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id)
      return { error: `Failed to create user profile: ${profileError.message}` }
    }
    console.log("[v0] User profile created")

    // Handle retailer creation or assignment
    let retailerId = userData.existingRetailerId
    if ((userData.role === "retailer" || userData.role === "location_user") && userData.businessType === "new") {
      console.log("[v0] Creating new retailer:", userData.businessName)

      const uniqueName = `${userData.businessName!.toLowerCase().replace(/\s+/g, "")}_${Date.now()}`

      const retailerData = {
        name: uniqueName,
        business_name: userData.businessName!,
        full_address: userData.businessAddress || "",
        business_phone: userData.businessPhone || "",
        business_email: userData.businessEmail || userData.email,
        website: userData.website || "",
        contact_person: `${userData.firstName} ${userData.lastName}`,
        tax_id: "", // Empty for now, can be filled later
        setup_completed: false, // Will be completed during business setup
        is_active: true, // New retailers are active by default
        created_by: currentUser.id,
      }

      console.log("[v0] Retailer data to insert:", retailerData)

      const { data: retailer, error: retailerError } = await supabase
        .from("retailers")
        .insert(retailerData)
        .select("id")
        .single()

      if (retailerError) {
        console.log("[v0] Retailer creation failed with detailed error:", {
          message: retailerError.message,
          details: retailerError.details,
          hint: retailerError.hint,
          code: retailerError.code,
        })
        await supabase.auth.admin.deleteUser(authUser.user.id)
        return { error: `Failed to create retailer: ${retailerError.message} (Code: ${retailerError.code})` }
      }

      if (!retailer) {
        console.log("[v0] Retailer creation returned no data")
        await supabase.auth.admin.deleteUser(authUser.user.id)
        return { error: "Failed to create retailer business: No data returned" }
      }

      retailerId = retailer.id
      console.log("[v0] Retailer created successfully:", retailerId)
    }

    // Create user role assignment
    console.log("[v0] Creating user role assignment")
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: authUser.user.id,
      role: userData.role,
      retailer_id: retailerId || null,
    })

    if (roleError) {
      console.log("[v0] Role assignment failed:", roleError)
      await supabase.auth.admin.deleteUser(authUser.user.id)
      return { error: `Failed to assign user role: ${roleError.message}` }
    }
    console.log("[v0] User role assigned")

    // Create user invitation record
    const { error: invitationError } = await supabase.from("user_invitations").insert({
      user_id: authUser.user.id,
      email: userData.email,
      role: userData.role,
      invited_by: currentUser.id,
      message:
        userData.invitationMessage ||
        "Welcome to our business management system. Please complete your account setup using the link below.",
      status: "pending",
    })

    if (invitationError) {
      console.error("Failed to create invitation record:", invitationError)
      // Don't fail the entire operation for this
    }

    // Send invitation email
    const redirectUrl =
      process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
      `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/auth/setup-account`

    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(userData.email, {
      redirectTo: redirectUrl,
    })

    if (inviteError) {
      console.error("Failed to send invitation email:", inviteError)
      // Update invitation status but don't fail the operation
      await supabase
        .from("user_invitations")
        .update({ status: "failed", error_message: inviteError.message })
        .eq("user_id", authUser.user.id)
    } else {
      // Update invitation status to sent
      await supabase
        .from("user_invitations")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("user_id", authUser.user.id)
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
        business_type: userData.businessType,
      },
    })

    revalidatePath("/dashboard/admin/users")
    return {
      success: "User created successfully and invitation sent",
      userId: authUser.user.id,
      email: userData.email,
    }
  } catch (error) {
    console.error("[v0] Unexpected error in createUserFromAdmin:", error)
    if (error instanceof Error) {
      return { error: `Unexpected error: ${error.message}` }
    }
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
    const resetRedirectUrl =
      process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
      `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/auth/reset-password`

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.user.email, {
      redirectTo: resetRedirectUrl,
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

export async function resendInvitation(userId: string) {
  try {
    console.log("[v0] Starting resend invitation for user:", userId)

    const supabase = createServiceClient()
    if (!supabase) {
      console.log("[v0] Service client not configured")
      return { error: "Service client not configured" }
    }

    const currentUser = await getCurrentUser()
    console.log("[v0] Current user:", currentUser?.email, currentUser?.role)

    if (!currentUser || !["admin", "office"].includes(currentUser.role)) {
      console.log("[v0] Unauthorized user")
      return { error: "Unauthorized to resend invitations" }
    }

    // Get user details
    console.log("[v0] Getting user details for:", userId)
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId)
    if (userError || !user.user?.email) {
      console.log("[v0] User not found:", userError)
      return { error: "User not found" }
    }
    console.log("[v0] Found user email:", user.user.email)

    // Check if user has already accepted invitation
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id, email_verified_at")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.log("[v0] Failed to check user status:", profileError)
      return { error: "Failed to check user status" }
    }

    if (profile.email_verified_at) {
      console.log("[v0] User has already verified email")
      return { error: "User has already completed account setup" }
    }

    // Send new invitation email
    const redirectUrl =
      process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
      `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/auth/setup-account`

    console.log("[v0] Sending invitation email to:", user.user.email, "with redirect:", redirectUrl)

    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(user.user.email, {
      redirectTo: redirectUrl,
    })

    if (inviteError) {
      console.log("[v0] Failed to send invitation email:", {
        message: inviteError.message,
        details: inviteError.details,
        hint: inviteError.hint,
        code: inviteError.code,
      })
      return { error: `Failed to send invitation email: ${inviteError.message}` }
    }
    console.log("[v0] Invitation email sent successfully")

    const { data: currentInvitation, error: getInvitationError } = await supabase
      .from("user_invitations")
      .select("resent_count")
      .eq("email", user.user.email)
      .single()

    const currentResentCount = currentInvitation?.resent_count || 0
    console.log("[v0] Current resent count:", currentResentCount)

    const { error: updateError } = await supabase
      .from("user_invitations")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        resent_count: currentResentCount + 1,
        created_at: new Date().toISOString(), // Update timestamp to track resend
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      })
      .eq("email", user.user.email)

    if (updateError) {
      console.log("[v0] Failed to update invitation record:", updateError)
      // Don't fail the operation for this
    } else {
      console.log("[v0] Updated invitation record successfully")
    }

    // Log audit trail
    await supabase.from("audit_logs").insert({
      user_id: currentUser.id,
      action: "RESEND_INVITATION",
      table_name: "user_invitations",
      record_id: userId,
      new_data: { action: "invitation_resent", email: user.user.email },
    })

    console.log("[v0] Resend invitation completed successfully")
    return { success: "Invitation resent successfully" }
  } catch (error) {
    console.error("[v0] Error resending invitation:", error)
    return { error: "An unexpected error occurred" }
  }
}
