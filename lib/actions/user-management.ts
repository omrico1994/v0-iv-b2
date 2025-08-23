"use server"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user"
import { revalidatePath } from "next/cache"
import { sendInvitationEmail, sendPasswordResetEmail } from "@/lib/email/resend-service"
import { generateInvitationToken } from "@/lib/utils/secure-tokens"
import {
  logServerAction,
  logServerActionError,
  logDatabaseOperation,
  logDatabaseError,
  logAuthOperation,
  logAuthError,
  logBusinessLogic,
  logBusinessError,
} from "@/lib/utils/server-logger"

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
  const actionName = "createUserFromAdmin"
  let currentUserId: string | undefined

  try {
    logServerAction(actionName, undefined, { email: userData.email, role: userData.role })

    const supabase = createServiceClient()
    if (!supabase) {
      logServerActionError(actionName, new Error("Service client not configured"))
      return { error: "Service client not configured" }
    }

    const currentUser = await getCurrentUser()
    currentUserId = currentUser?.id
    logAuthOperation("getCurrentUser", currentUserId, { action: actionName })

    // Check permissions
    if (!currentUser || !["admin", "office"].includes(currentUser.role)) {
      logAuthError("unauthorized_access", new Error("Unauthorized user"), currentUserId, {
        userRole: currentUser?.role,
        requiredRoles: ["admin", "office"],
      })
      return { error: "Unauthorized to create users" }
    }

    // Validate required fields
    if (!userData.email || !userData.firstName || !userData.lastName || !userData.role) {
      const missingFields = {
        email: !!userData.email,
        firstName: !!userData.firstName,
        lastName: !!userData.lastName,
        role: !!userData.role,
      }
      logBusinessError("validation_failed", new Error("Missing required fields"), currentUserId, {
        missingFields,
        action: actionName,
      })
      return { error: "Missing required fields" }
    }

    // Role-specific validations
    if (
      (userData.role === "retailer" || userData.role === "location_user") &&
      userData.businessType === "new" &&
      !userData.businessName
    ) {
      logBusinessError("validation_failed", new Error("Missing business name"), currentUserId, {
        role: userData.role,
        businessType: userData.businessType,
      })
      return { error: "Business name is required for new retailer" }
    }

    if (
      (userData.role === "retailer" || userData.role === "location_user") &&
      userData.businessType === "existing" &&
      !userData.existingRetailerId
    ) {
      logBusinessError("validation_failed", new Error("Missing retailer ID"), currentUserId, {
        role: userData.role,
        businessType: userData.businessType,
      })
      return { error: "Must select an existing retailer" }
    }

    // Check if user already exists
    logDatabaseOperation("listUsers", "auth.users", { email: userData.email })
    const { data: usersList, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) {
      logDatabaseError("listUsers", "auth.users", listError, { email: userData.email })
      return { error: "Failed to check existing users" }
    }

    const existingUser = usersList.users.find((user) => user.email === userData.email)
    if (existingUser) {
      logBusinessError("user_already_exists", new Error("User already exists"), currentUserId, {
        email: userData.email,
      })
      return { error: "User with this email already exists" }
    }

    // Create user in Supabase Auth
    logAuthOperation("createUser", currentUserId, { email: userData.email, role: userData.role })
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
      logAuthError("createUser", authError || new Error("No user returned"), currentUserId, {
        email: userData.email,
      })
      return { error: authError?.message || "Failed to create user account" }
    }
    logAuthOperation("createUser_success", currentUserId, {
      newUserId: authUser.user.id,
      email: userData.email,
    })

    // Create user profile
    logDatabaseOperation("insert", "user_profiles", { userId: authUser.user.id })
    const { error: profileError } = await supabase.from("user_profiles").insert({
      id: authUser.user.id,
      first_name: userData.firstName,
      last_name: userData.lastName,
      phone: userData.phone,
      business_setup_completed:
        userData.role === "admin" || userData.role === "office" || userData.businessType === "existing",
    })

    if (profileError) {
      logDatabaseError("insert", "user_profiles", profileError, { userId: authUser.user.id })
      // Cleanup auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id)
      return { error: `Failed to create user profile: ${profileError.message}` }
    }
    logDatabaseOperation("insert_success", "user_profiles", { userId: authUser.user.id })

    // Handle retailer creation or assignment
    let retailerId = userData.existingRetailerId
    let businessName = userData.businessName
    if ((userData.role === "retailer" || userData.role === "location_user") && userData.businessType === "new") {
      logBusinessLogic("create_new_retailer", currentUserId, { businessName: userData.businessName })

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

      logDatabaseOperation("insert", "retailers", { businessName: userData.businessName })

      const { data: retailer, error: retailerError } = await supabase
        .from("retailers")
        .insert(retailerData)
        .select("id, business_name")
        .single()

      if (retailerError) {
        logDatabaseError("insert", "retailers", retailerError, {
          businessName: userData.businessName,
          errorDetails: {
            message: retailerError.message,
            details: retailerError.details,
            hint: retailerError.hint,
            code: retailerError.code,
          },
        })
        await supabase.auth.admin.deleteUser(authUser.user.id)
        return { error: `Failed to create retailer: ${retailerError.message} (Code: ${retailerError.code})` }
      }

      if (!retailer) {
        logBusinessError("retailer_creation_no_data", new Error("No retailer data returned"), currentUserId)
        await supabase.auth.admin.deleteUser(authUser.user.id)
        return { error: "Failed to create retailer business: No data returned" }
      }

      retailerId = retailer.id
      businessName = retailer.business_name
      logBusinessLogic("create_new_retailer_success", currentUserId, {
        retailerId,
        businessName,
      })
    } else if (userData.businessType === "existing" && userData.existingRetailerId) {
      // Get existing retailer business name
      const { data: existingRetailer } = await supabase
        .from("retailers")
        .select("business_name")
        .eq("id", userData.existingRetailerId)
        .single()

      businessName = existingRetailer?.business_name
    }

    // Create user role assignment
    logDatabaseOperation("insert", "user_roles", { userId: authUser.user.id, role: userData.role })
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: authUser.user.id,
      role: userData.role,
      retailer_id: retailerId || null,
    })

    if (roleError) {
      logDatabaseError("insert", "user_roles", roleError, { userId: authUser.user.id })
      await supabase.auth.admin.deleteUser(authUser.user.id)
      return { error: `Failed to assign user role: ${roleError.message}` }
    }
    logDatabaseOperation("insert_success", "user_roles", { userId: authUser.user.id })

    const secureTokenData = await generateInvitationToken(userData.email, 168) // 7 days instead of 24 hours
    const invitationToken = secureTokenData.token

    const { error: invitationError } = await supabase.from("user_invitations").insert({
      email: userData.email,
      role: userData.role === "location_user" ? "location" : userData.role,
      invited_by: currentUser.id,
      retailer_id: retailerId || null,
      invitation_token: invitationToken,
      expires_at: secureTokenData.expiresAt.toISOString(),
      status: "pending",
      resent_count: 0,
      email_provider: "resend",
      delivery_status: "pending",
      last_delivery_attempt: new Date().toISOString(),
    })

    if (invitationError) {
      logDatabaseError("insert", "user_invitations", invitationError, { email: userData.email })
      // Don't fail the entire operation for this
    }

    logBusinessLogic("send_invitation_email", currentUserId, { email: userData.email })
    const setupUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/setup-account?token=${invitationToken}&email=${encodeURIComponent(userData.email)}`

    const emailResult = await sendInvitationEmail({
      to: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role === "location_user" ? "location" : userData.role,
      businessName: businessName,
      setupUrl: setupUrl,
    })

    if (!emailResult.success) {
      logBusinessError("send_invitation_email_failed", new Error(emailResult.error), currentUserId, {
        email: userData.email,
      })
      await supabase
        .from("user_invitations")
        .update({
          status: "failed",
          delivery_status: "failed",
          delivery_error: emailResult.error,
          last_delivery_attempt: new Date().toISOString(),
        })
        .eq("email", userData.email)
    } else {
      logBusinessLogic("send_invitation_email_success", currentUserId, {
        email: userData.email,
        emailId: emailResult.emailId,
      })
      await supabase
        .from("user_invitations")
        .update({
          status: "sent",
          delivery_status: "delivered",
          email_id: emailResult.emailId,
          sent_at: new Date().toISOString(),
          resent_count: 0,
          last_delivery_attempt: new Date().toISOString(),
        })
        .eq("email", userData.email)
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
    logServerAction(`${actionName}_success`, currentUserId, {
      newUserId: authUser.user.id,
      email: userData.email,
    })
    return {
      success: "User created successfully and invitation sent",
      userId: authUser.user.id,
      email: userData.email,
    }
  } catch (error) {
    logServerActionError(actionName, error instanceof Error ? error : new Error(String(error)), currentUserId)
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
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/reset-password`

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.user.email, {
      redirectTo: resetUrl,
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
  const actionName = "resendInvitation"
  let currentUserId: string | undefined

  try {
    logServerAction(actionName, undefined, { targetUserId: userId })

    const supabase = createServiceClient()
    if (!supabase) {
      logServerActionError(actionName, new Error("Service client not configured"))
      return { error: "Service client not configured" }
    }

    const currentUser = await getCurrentUser()
    currentUserId = currentUser?.id
    logAuthOperation("getCurrentUser", currentUserId, { action: actionName })

    if (!currentUser || !["admin", "office"].includes(currentUser.role)) {
      logAuthError("unauthorized_access", new Error("Unauthorized user"), currentUserId, {
        userRole: currentUser?.role,
      })
      return { error: "Unauthorized to resend invitations" }
    }

    // Get user details with role and business info
    logDatabaseOperation("getUserById", "auth.users", { userId })
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId)
    if (userError || !user.user?.email) {
      logDatabaseError("getUserById", "auth.users", userError || new Error("No user email"), { userId })
      return { error: "User not found" }
    }

    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id, first_name, last_name, email_verified_at")
      .eq("id", userId)
      .single()

    if (profileError) {
      logDatabaseError("select", "user_profiles", profileError, { userId })
      return { error: "Failed to get user details" }
    }

    const { data: userRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role, retailer_id")
      .eq("user_id", userId)
      .single()

    if (roleError) {
      logDatabaseError("select", "user_roles", roleError, { userId })
      return { error: "Failed to get user role" }
    }

    let retailerName = null
    if (userRole.retailer_id) {
      const { data: retailer } = await supabase
        .from("retailers")
        .select("business_name")
        .eq("id", userRole.retailer_id)
        .single()

      retailerName = retailer?.business_name
    }

    if (userProfile.email_verified_at) {
      logBusinessError("user_already_verified", new Error("User already verified"), currentUserId, {
        userId,
        email: user.user.email,
      })
      return { error: "User has already completed account setup" }
    }

    const secureTokenData = await generateInvitationToken(user.user.email, 168) // 7 days
    const newInvitationToken = secureTokenData.token

    const { error: updateTokenError } = await supabase
      .from("user_invitations")
      .update({
        invitation_token: newInvitationToken,
        expires_at: secureTokenData.expiresAt.toISOString(),
        status: "pending",
      })
      .eq("email", user.user.email)

    if (updateTokenError) {
      logDatabaseError("update", "user_invitations", updateTokenError, { email: user.user.email })
      return { error: "Failed to update invitation token" }
    }

    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/setup-account?token=${newInvitationToken}&email=${encodeURIComponent(user.user.email)}&type=reset`

    logBusinessLogic("send_password_reset_email", currentUserId, { email: user.user.email })
    const emailResult = await sendPasswordResetEmail({
      to: user.user.email,
      resetUrl,
      firstName: userProfile.first_name,
      lastName: userProfile.last_name,
      role: userRole.role === "location_user" ? "location" : userRole.role,
      businessName: retailerName,
    })

    if (!emailResult.success) {
      logBusinessError("send_password_reset_email_failed", new Error(emailResult.error), currentUserId, {
        email: user.user.email,
      })
      await supabase
        .from("user_invitations")
        .update({
          delivery_status: "failed",
          delivery_error: emailResult.error,
          last_delivery_attempt: new Date().toISOString(),
        })
        .eq("email", user.user.email)
      return { error: `Failed to send invitation email: ${emailResult.error}` }
    }
    logBusinessLogic("send_password_reset_email_success", currentUserId, {
      email: user.user.email,
      emailId: emailResult.emailId,
    })

    // Update invitation record
    const { data: currentInvitation, error: getInvitationError } = await supabase
      .from("user_invitations")
      .select("resent_count")
      .eq("email", user.user.email)
      .single()

    const currentResentCount = currentInvitation?.resent_count || 0
    logDatabaseOperation("update", "user_invitations", {
      email: user.user.email,
      currentResentCount,
    })

    const { error: updateError } = await supabase
      .from("user_invitations")
      .update({
        status: "sent",
        delivery_status: "delivered",
        email_id: emailResult.emailId,
        sent_at: new Date().toISOString(),
        resent_count: currentResentCount + 1,
        last_delivery_attempt: new Date().toISOString(),
        delivery_error: null, // Clear any previous errors
      })
      .eq("email", user.user.email)

    if (updateError) {
      logDatabaseError("update", "user_invitations", updateError, { email: user.user.email })
      // Don't fail the operation for this
    } else {
      logDatabaseOperation("update_success", "user_invitations", { email: user.user.email })
    }

    // Log audit trail
    await supabase.from("audit_logs").insert({
      user_id: currentUser.id,
      action: "RESEND_INVITATION",
      table_name: "user_invitations",
      record_id: userId,
      new_data: { action: "invitation_resent", email: user.user.email },
    })

    logServerAction(`${actionName}_success`, currentUserId, {
      targetUserId: userId,
      email: user.user.email,
    })
    return { success: "Invitation resent successfully" }
  } catch (error) {
    logServerActionError(actionName, error instanceof Error ? error : new Error(String(error)), currentUserId)
    return { error: "An unexpected error occurred" }
  }
}
