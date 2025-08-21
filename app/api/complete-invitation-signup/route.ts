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

    if (!token || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate invitation token
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from("user_invitations")
      .select("*, user_profiles(user_id, role)")
      .eq("invitation_token", token)
      .eq("email", email)
      .eq("status", "pending")
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 400 })
    }

    // Check if invitation is expired (24 hours)
    const invitationDate = new Date(invitation.created_at)
    const now = new Date()
    const hoursDiff = (now.getTime() - invitationDate.getTime()) / (1000 * 60 * 60)

    if (hoursDiff > 24) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 })
    }

    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Automatically confirm email for invitation flows
      user_metadata: {
        invitation_token: token,
        role: invitation.role,
      },
    })

    if (signUpError || !authData.user) {
      return NextResponse.json({ error: signUpError?.message || "Failed to create user" }, { status: 400 })
    }

    // Update user profile with admin privileges
    const { error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .update({
        email_verified_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      })
      .eq("user_id", authData.user.id)

    if (profileError) {
      console.error("Profile update error:", profileError)
    }

    // Update invitation status with admin privileges
    const { error: invitationUpdateError } = await supabaseAdmin
      .from("user_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("invitation_token", token)

    if (invitationUpdateError) {
      console.error("Invitation update error:", invitationUpdateError)
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
    console.error("Complete invitation signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
