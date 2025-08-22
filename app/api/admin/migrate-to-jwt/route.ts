import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createSecureInvitationToken } from "@/lib/utils/secure-tokens"

export async function GET() {
  try {
    const supabase = createClient()

    // Get current token format statistics
    const { data: invitations, error } = await supabase
      .from("user_invitations")
      .select("invitation_token, status")
      .in("status", ["pending", "sent"])

    if (error) {
      return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 })
    }

    const stats = invitations.reduce((acc: any, inv) => {
      let format = "Unknown format"
      if (inv.invitation_token.startsWith("eyJ")) {
        format = "JWT format"
      } else if (inv.invitation_token.startsWith("REGENERATE_")) {
        format = "REGENERATE format"
      } else if (/^[a-f0-9-]{36}_[0-9]+$/.test(inv.invitation_token)) {
        format = "Legacy UUID_TIMESTAMP"
      } else if (/^[a-zA-Z0-9+/]+=*\.[a-zA-Z0-9+/]+=*\.[a-f0-9]+$/.test(inv.invitation_token)) {
        format = "Custom 3-part"
      }

      const key = `${format}_${inv.status}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({ stats, total: invitations.length })
  } catch (error) {
    console.error("Migration check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST() {
  try {
    const supabase = createClient()

    // Get all non-JWT tokens
    const { data: invitations, error: fetchError } = await supabase
      .from("user_invitations")
      .select("id, email, invitation_token, expires_at, invited_by, role")
      .in("status", ["pending", "sent"])
      .not("invitation_token", "like", "eyJ%") // Exclude existing JWT tokens

    if (fetchError) {
      return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 })
    }

    let updatedCount = 0
    const errors: string[] = []

    for (const invitation of invitations) {
      try {
        // Calculate expiration time (7 days from now if not set)
        const expirationTime = invitation.expires_at
          ? Math.floor(new Date(invitation.expires_at).getTime() / 1000)
          : Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000)

        // Generate new JWT token
        const newJwtToken = await createSecureInvitationToken({
          email: invitation.email,
          invitedBy: invitation.invited_by || "",
          exp: expirationTime,
        })

        // Update the invitation record
        const { error: updateError } = await supabase
          .from("user_invitations")
          .update({ invitation_token: newJwtToken })
          .eq("id", invitation.id)

        if (updateError) {
          errors.push(`Failed to update invitation ${invitation.id}: ${updateError.message}`)
        } else {
          updatedCount++
        }
      } catch (tokenError) {
        errors.push(`Failed to generate token for invitation ${invitation.id}: ${tokenError}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration completed. Updated ${updatedCount} invitation tokens.`,
      updatedCount,
      totalProcessed: invitations.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
