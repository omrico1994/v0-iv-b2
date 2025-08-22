import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createSecureInvitationToken } from "@/lib/utils/secure-tokens"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get current user and verify admin permissions
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("user_profiles").select("role").eq("user_id", user.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get all pending invitations
    const { data: invitations, error: fetchError } = await supabase
      .from("user_invitations")
      .select("id, email, invited_by, expires_at")
      .eq("status", "pending")
      .or("expires_at.is.null,expires_at.gt.now()")

    if (fetchError) {
      console.error("Error fetching invitations:", fetchError)
      return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 })
    }

    let updatedCount = 0

    // Regenerate tokens for each invitation
    for (const invitation of invitations || []) {
      try {
        const expirationTime = invitation.expires_at
          ? Math.floor(new Date(invitation.expires_at).getTime() / 1000)
          : Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000) // 7 days default

        const newToken = await createSecureInvitationToken({
          email: invitation.email,
          invitedBy: invitation.invited_by || "",
          exp: expirationTime,
        })

        const { error: updateError } = await supabase
          .from("user_invitations")
          .update({
            invitation_token: newToken,
          })
          .eq("id", invitation.id)

        if (updateError) {
          console.error(`Error updating invitation ${invitation.id}:`, updateError)
        } else {
          updatedCount++
        }
      } catch (tokenError) {
        console.error(`Error generating token for invitation ${invitation.id}:`, tokenError)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Regenerated ${updatedCount} invitation tokens with JWT format`,
      updatedCount,
    })
  } catch (error) {
    console.error("Error in regenerate-tokens API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
