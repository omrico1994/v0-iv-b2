import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json()

    console.log("[v0] Validation request received:", { token, email })

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

    console.log("[v0] Querying database for invitation...")

    const { data: invitation, error: invitationError } = await supabase
      .from("user_invitations")
      .select("*")
      .eq("invitation_token", token)
      .eq("email", email)
      .in("status", ["pending", "sent"])
      .single()

    console.log("[v0] Database query result:", { invitation, invitationError })

    if (invitationError || !invitation) {
      console.log("[v0] Invitation validation failed:", invitationError)
      return NextResponse.json({ valid: false, error: "Invalid or expired invitation" }, { status: 404 })
    }

    // Check if token is expired (24 hours)
    const tokenAge = Date.now() - new Date(invitation.created_at).getTime()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours

    console.log("[v0] Token age check:", { tokenAge, maxAge, expired: tokenAge > maxAge })

    if (tokenAge > maxAge) {
      return NextResponse.json({ valid: false, error: "Invitation has expired" }, { status: 410 })
    }

    console.log("[v0] Invitation validation successful")
    return NextResponse.json({ valid: true, invitation })
  } catch (error) {
    console.error("[v0] Invitation validation error:", error)
    return NextResponse.json({ valid: false, error: "Internal server error" }, { status: 500 })
  }
}
