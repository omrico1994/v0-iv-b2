import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { token, email, password } = await request.json()

    console.log("[v0] Complete invitation signup request:", { token, email, hasPassword: !!password })

    if (!token || !email || !password) {
      console.log("[v0] Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("[v0] Validating invitation token...")

    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from("user_invitations")
      .select("*, user_profiles(user_id, role)")
      .eq("invitation_token", token)
      .eq("email", email)
      .in("status", ["pending", "sent"])
      .single()

    console.log("[v0] Invitation query result:", { invitation, invitationError })

    if (invitationError || !invitation) {
      console.log("[v0] Invalid invitation:", invitationError)
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 400 })
    }

    // Check if invitation is expired (24 hours)
    const invitationDate = new Date(invitation.created_at)
    const now = new Date()
    const hoursDiff = (now.getTime() - invitationDate.getTime()) / (1000 * 60 * 60)

    console.log("[v0] Invitation age check:", { invitationDate, now, hoursDiff })

    if (hoursDiff > 24) {
      console.log("[v0] Invitation expired")
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 })
    }

    console.log("[v0] Creating user with admin API...")

    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email)

    let authData
    if (existingUser?.user) {
      console.log("[v0] User already exists, updating password...")

      // Update existing user's password
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.user.id,
        {
          password: password,
          email_confirm: true,
          user_metadata: {
            ...existingUser.user.user_metadata,
            invitation_token: token,
            role: invitation.role,
          },
        },
      )

      if (updateError) {
        console.log("[v0] User update failed:", updateError)
        return NextResponse.json({ error: updateError.message || "Failed to update user" }, { status: 400 })
      }

      authData = { user: updateData.user }
      console.log("[v0] User password updated successfully")
    } else {
      console.log("[v0] Creating new user...")

      const { data: createData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          invitation_token: token,
          role: invitation.role,
        },
      })

      if (signUpError || !createData.user) {
        console.log("[v0] User creation failed:", signUpError)
        return NextResponse.json({ error: signUpError?.message || "Failed to create user" }, { status: 400 })
      }

      authData = createData
      console.log("[v0] New user created successfully")
    }

    console.log("[v0] Updating user profile...")

    // Update user profile with admin privileges
    const { error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .update({
        email_verified_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      })
      .eq("user_id", authData.user.id)

    if (profileError) {
      console.error("[v0] Profile update error:", profileError)
    }

    console.log("[v0] Updating invitation status...")

    // Update invitation status with admin privileges
    const { error: invitationUpdateError } = await supabaseAdmin
      .from("user_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("invitation_token", token)

    if (invitationUpdateError) {
      console.error("[v0] Invitation update error:", invitationUpdateError)
    }

    // Determine redirect URL based on role
    let redirectUrl = "/dashboard"

    if (invitation.role === "retailer") {
      redirectUrl = "/dashboard/retailer"
    } else if (invitation.role === "admin") {
      redirectUrl = "/dashboard/admin"
    } else if (invitation.role === "office") {
      redirectUrl = "/dashboard/office"
    }

    console.log("[v0] Account setup completed successfully:", { redirectUrl, role: invitation.role })

    return NextResponse.json({
      success: true,
      redirectUrl,
      message: "Account setup completed successfully",
      user: {
        email: authData.user.email,
        id: authData.user.id,
      },
    })
  } catch (error) {
    console.error("[v0] Complete invitation signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
