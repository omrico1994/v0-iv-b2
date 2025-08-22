import { createSecureInvitationToken } from "./secure-tokens"

export async function regenerateInvitationTokens() {
  try {
    // This would typically be called from an admin interface or migration script
    const response = await fetch("/api/admin/regenerate-tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to regenerate tokens")
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error regenerating tokens:", error)
    throw error
  }
}

export function generateNewInvitationToken(email: string, invitedBy: string, expiresAt?: Date): string {
  const payload = {
    email,
    invitedBy,
    exp: expiresAt ? Math.floor(expiresAt.getTime() / 1000) : Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000), // 7 days default
  }

  return createSecureInvitationToken(payload)
}
