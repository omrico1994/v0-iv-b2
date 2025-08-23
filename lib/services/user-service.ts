import { createServiceClient } from "@/lib/supabase/server"
import { validateInvitationToken } from "@/lib/utils/secure-tokens"

export interface UserCreationData {
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: "admin" | "office" | "retailer" | "location_user"
  retailerId?: string
  password?: string
  invitationToken?: string
}

export interface UserCreationResult {
  success: boolean
  user?: {
    id: string
    email: string
  }
  error?: string
  redirectUrl?: string
}

export class UserService {
  private supabase

  constructor() {
    this.supabase = createServiceClient()
    if (!this.supabase) {
      throw new Error("Service client not configured")
    }
  }

  async createOrUpdateUser(data: UserCreationData): Promise<UserCreationResult> {
    try {
      console.log("[v0] UserService: Starting user creation/update:", { email: data.email, role: data.role })

      const missingFields = []
      if (!data.email?.trim()) missingFields.push("email")
      if (!data.firstName?.trim()) missingFields.push("firstName")
      if (!data.role?.trim()) missingFields.push("role")

      // lastName can be empty string, so only check if it's null/undefined
      if (data.lastName === null || data.lastName === undefined) {
        missingFields.push("lastName")
      }

      console.log("[v0] UserService: Field validation:", {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        missingFields,
      })

      if (missingFields.length > 0) {
        console.log("[v0] UserService: Missing required fields:", missingFields)
        return { success: false, error: `Missing required fields: ${missingFields.join(", ")}` }
      }

      // Check if user already exists
      const { data: existingUser } = await this.supabase.auth.admin.getUserByEmail(data.email)

      let authUser
      if (existingUser?.user) {
        console.log("[v0] UserService: Updating existing user")

        // Update existing user
        const updateData: any = {
          user_metadata: {
            ...existingUser.user.user_metadata,
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            role: data.role,
          },
        }

        if (data.password) {
          updateData.password = data.password
          updateData.email_confirm = true
        }

        if (data.invitationToken) {
          updateData.user_metadata.invitation_token = data.invitationToken
        }

        const { data: updateResult, error: updateError } = await this.supabase.auth.admin.updateUserById(
          existingUser.user.id,
          updateData,
        )

        if (updateError) {
          console.log("[v0] UserService: User update failed:", updateError)
          return { success: false, error: updateError.message || "Failed to update user" }
        }

        authUser = updateResult.user
      } else {
        console.log("[v0] UserService: Creating new user")

        // Create new user
        const createData: any = {
          email: data.email,
          email_confirm: data.password ? true : false,
          user_metadata: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            role: data.role,
          },
        }

        if (data.password) {
          createData.password = data.password
        }

        if (data.invitationToken) {
          createData.user_metadata.invitation_token = data.invitationToken
        }

        const { data: createResult, error: createError } = await this.supabase.auth.admin.createUser(createData)

        if (createError || !createResult.user) {
          console.log("[v0] UserService: User creation failed:", createError)
          return { success: false, error: createError?.message || "Failed to create user" }
        }

        authUser = createResult.user
      }

      try {
        // Update profile and role in parallel
        const [profileResult, roleResult] = await Promise.all([
          this.supabase.from("user_profiles").upsert({
            id: authUser.id,
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            email_verified_at: data.password ? new Date().toISOString() : null,
            last_login_at: data.password ? new Date().toISOString() : null,
            business_setup_completed: data.role === "admin" || data.role === "office",
          }),
          this.supabase.from("user_roles").upsert({
            user_id: authUser.id,
            role: data.role,
            retailer_id: data.retailerId || null,
          }),
        ])

        if (profileResult.error) {
          throw new Error(`Profile update failed: ${profileResult.error.message}`)
        }

        if (roleResult.error) {
          throw new Error(`Role assignment failed: ${roleResult.error.message}`)
        }
      } catch (dbError) {
        // If database operations fail, we should clean up the auth user
        console.error("[v0] Database operations failed, cleaning up auth user:", dbError)

        try {
          await this.supabase.auth.admin.deleteUser(authUser.id)
        } catch (cleanupError) {
          console.error("[v0] Failed to cleanup auth user:", cleanupError)
        }

        return { success: false, error: dbError instanceof Error ? dbError.message : "Database operation failed" }
      }

      const redirectUrl = this.getRedirectUrlForRole(data.role)

      console.log("[v0] UserService: User creation/update completed successfully")

      return {
        success: true,
        user: {
          id: authUser.id,
          email: authUser.email!,
        },
        redirectUrl,
      }
    } catch (error) {
      console.error("[v0] UserService: Unexpected error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  async validateInvitation(
    token: string,
    email: string,
  ): Promise<{ valid: boolean; invitation?: any; error?: string }> {
    try {
      console.log("[v0] UserService: Validating invitation token")

      const tokenValidation = await validateInvitationToken(token, email)
      if (!tokenValidation.isValid) {
        return { valid: false, error: "Invalid invitation token" }
      }

      if (tokenValidation.isExpired) {
        return { valid: false, error: "Invitation has expired" }
      }

      const { data: invitation, error: invitationError } = await this.supabase
        .from("user_invitations")
        .select("*")
        .eq("invitation_token", token)
        .eq("email", email)
        .in("status", ["pending", "sent"])
        .single()

      if (invitationError || !invitation) {
        console.log("[v0] UserService: Database invitation validation failed:", invitationError)
        return { valid: false, error: "Invalid or expired invitation" }
      }

      if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        // Update status to expired in database
        await this.supabase.from("user_invitations").update({ status: "expired" }).eq("invitation_token", token)

        return { valid: false, error: "Invitation has expired" }
      }

      return { valid: true, invitation }
    } catch (error) {
      console.error("[v0] UserService: Invitation validation error:", error)
      return { valid: false, error: "Internal server error" }
    }
  }

  async completeInvitation(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error: updateError } = await this.supabase
        .from("user_invitations")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("invitation_token", token)

      if (updateError) {
        console.error("[v0] UserService: Invitation completion failed:", updateError)
        return { success: false, error: "Failed to complete invitation" }
      }

      return { success: true }
    } catch (error) {
      console.error("[v0] UserService: Invitation completion error:", error)
      return { success: false, error: "Internal server error" }
    }
  }

  private getRedirectUrlForRole(role: string): string {
    switch (role) {
      case "retailer":
        return "/dashboard/retailer"
      case "admin":
        return "/dashboard/admin"
      case "office":
        return "/dashboard/office"
      case "location_user":
        return "/dashboard/location"
      default:
        return "/dashboard"
    }
  }
}
