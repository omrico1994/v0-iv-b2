import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateNewInvitationToken } from "@/lib/utils/regenerate-tokens"

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
        const newToken = generateNewInvitationToken(
          invitation.email,
          invitation.invited_by,
          invitation.expires_at ? new Date(invitation.expires_at) : undefined,
        )

        const { error: updateError } = await supabase
          .from("user_invitations")
          .update({
            token: newToken,
            updated_at: new Date().toISOString(),
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
      message: `Regenerated ${updatedCount} invitation tokens`,
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
