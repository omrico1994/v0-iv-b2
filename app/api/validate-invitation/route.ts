import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json()

    if (!token || !email) {
      return NextResponse.json({ valid: false, error: "Token and email are required" }, { status: 400 })
    }

    // Use service role client to bypass RLS policies
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: invitation, error: invitationError } = await supabase
      .from("user_invitations")
      .select("*")
      .eq("invitation_token", token)
      .eq("email", email)
      .eq("status", "pending")
      .single()

    if (invitationError || !invitation) {
      console.log("[v0] Invitation validation failed:", invitationError)
      return NextResponse.json({ valid: false, error: "Invalid or expired invitation" }, { status: 404 })
    }

    // Check if token is expired (24 hours)
    const tokenAge = Date.now() - new Date(invitation.created_at).getTime()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours

    if (tokenAge > maxAge) {
      return NextResponse.json({ valid: false, error: "Invitation has expired" }, { status: 410 })
    }

    return NextResponse.json({ valid: true, invitation })
  } catch (error) {
    console.error("[v0] Invitation validation error:", error)
    return NextResponse.json({ valid: false, error: "Internal server error" }, { status: 500 })
  }
}
