import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createSecureInvitationToken } from "@/lib/utils/secure-tokens"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data: insecureInvitations, error: fetchError } = await supabase
      .from("user_invitations")
      .select("*")
      .not("invitation_token", "like", "eyJ%") // Exclude existing JWT tokens
      .in("status", ["sent", "pending"])

    if (fetchError) {
      console.error("Error fetching insecure invitations:", fetchError)
      return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 })
    }

    if (!insecureInvitations || insecureInvitations.length === 0) {
      return NextResponse.json({
        message: "No non-JWT tokens found to replace",
        replaced: 0,
      })
    }

    console.log(`[v0] Found ${insecureInvitations.length} non-JWT tokens to replace`)

    const replacedTokens = []

    // Replace each non-JWT token with a JWT token
    for (const invitation of insecureInvitations) {
      try {
        const expirationTime = invitation.expires_at
          ? Math.floor(new Date(invitation.expires_at).getTime() / 1000)
          : Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000) // 7 days default

        const newToken = await createSecureInvitationToken({
          email: invitation.email,
          invitedBy: invitation.invited_by || "",
          exp: expirationTime,
        })

        // Update the invitation with the new JWT token
        const { error: updateError } = await supabase
          .from("user_invitations")
          .update({
            invitation_token: newToken,
            expires_at: new Date(expirationTime * 1000).toISOString(),
          })
          .eq("id", invitation.id)

        if (updateError) {
          console.error(`Error updating invitation ${invitation.id}:`, updateError)
          continue
        }

        replacedTokens.push({
          id: invitation.id,
          email: invitation.email,
          oldToken: invitation.invitation_token.substring(0, 20) + "...",
          newToken: "JWT:" + newToken.substring(0, 20) + "...", // Show JWT prefix for clarity
        })

        console.log(`[v0] Replaced token for ${invitation.email} with JWT`)
      } catch (tokenError) {
        console.error(`Error generating JWT token for ${invitation.email}:`, tokenError)
        continue
      }
    }

    return NextResponse.json({
      message: `Successfully replaced ${replacedTokens.length} tokens with JWT format`,
      replaced: replacedTokens.length,
      total: insecureInvitations.length,
      details: replacedTokens,
    })
  } catch (error) {
    console.error("Error in replace-insecure-tokens:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check current token formats
    const { data: tokenStats, error } = await supabase
      .from("user_invitations")
      .select("invitation_token, status")
      .in("status", ["sent", "pending"])

    if (error) {
      return NextResponse.json({ error: "Failed to fetch token stats" }, { status: 500 })
    }

    const stats = {
      total: tokenStats?.length || 0,
      jwt: tokenStats?.filter((t) => t.invitation_token?.startsWith("eyJ")).length || 0,
      regenerate: tokenStats?.filter((t) => t.invitation_token?.startsWith("REGENERATE_")).length || 0,
      custom3part:
        tokenStats?.filter(
          (t) =>
            t.invitation_token &&
            !t.invitation_token.startsWith("eyJ") &&
            !t.invitation_token.startsWith("REGENERATE_") &&
            t.invitation_token.includes("."),
        ).length || 0,
      legacy:
        tokenStats?.filter(
          (t) =>
            t.invitation_token &&
            !t.invitation_token.startsWith("eyJ") &&
            !t.invitation_token.startsWith("REGENERATE_") &&
            !t.invitation_token.includes("."),
        ).length || 0,
    }

    return NextResponse.json({
      message: "Token format statistics",
      stats,
      needsReplacement: stats.regenerate + stats.custom3part + stats.legacy > 0,
    })
  } catch (error) {
    console.error("Error getting token stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
