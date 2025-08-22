import { randomBytes, createHmac } from "crypto"

export interface SecureToken {
  token: string
  expiresAt: Date
}

export interface TokenValidation {
  isValid: boolean
  isExpired: boolean
  payload?: any
}

// Generate cryptographically secure invitation token
export function generateInvitationToken(email: string, expirationHours = 24): SecureToken {
  // Generate 32 bytes of random data for the token
  const randomToken = randomBytes(32).toString("hex")

  // Create expiration timestamp
  const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000)

  // Create payload with email and expiration
  const payload = {
    email,
    exp: expiresAt.getTime(),
    iat: Date.now(),
    type: "invitation",
  }

  // Sign the token with HMAC to prevent tampering
  const secret = process.env.INVITATION_TOKEN_SECRET || process.env.SUPABASE_JWT_SECRET || "fallback-secret"
  const payloadString = JSON.stringify(payload)
  const signature = createHmac("sha256", secret).update(payloadString).digest("hex")

  // Combine random token with signed payload
  const secureToken = `${randomToken}.${Buffer.from(payloadString).toString("base64")}.${signature}`

  return {
    token: secureToken,
    expiresAt,
  }
}

// Validate and decode invitation token
export function validateInvitationToken(token: string, email: string): TokenValidation {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) {
      console.log("[v0] Invalid token format - expected 3 parts, got:", parts.length)
      return { isValid: false, isExpired: false }
    }

    const [randomPart, payloadPart, signature] = parts

    // Decode payload
    const payloadString = Buffer.from(payloadPart, "base64").toString("utf-8")
    const payload = JSON.parse(payloadString)

    // Verify signature
    const secret = process.env.INVITATION_TOKEN_SECRET || process.env.SUPABASE_JWT_SECRET || "fallback-secret"
    const expectedSignature = createHmac("sha256", secret).update(payloadString).digest("hex")

    if (signature !== expectedSignature) {
      console.log("[v0] Token signature validation failed")
      return { isValid: false, isExpired: false }
    }

    // Check email match
    if (payload.email !== email) {
      console.log("[v0] Token email mismatch")
      return { isValid: false, isExpired: false }
    }

    // Check expiration
    const now = Date.now()
    const isExpired = now > payload.exp

    console.log("[v0] Cryptographic token validation successful")
    return {
      isValid: true,
      isExpired,
      payload,
    }
  } catch (error) {
    console.error("[v0] Token validation error:", error)
    return { isValid: false, isExpired: false }
  }
}

// Generate simple secure token for backward compatibility
export function generateSecureToken(): string {
  return randomBytes(32).toString("hex")
}

export function createSecureInvitationToken(payload: { email: string; invitedBy: string; exp: number }): string {
  // Generate 32 bytes of random data for the token
  const randomPart = randomBytes(16).toString("hex")

  // Create the payload string
  const payloadString = JSON.stringify(payload)
  const encodedPayload = Buffer.from(payloadString).toString("base64")

  // Sign the token with HMAC to prevent tampering
  const secret = process.env.INVITATION_TOKEN_SECRET || process.env.SUPABASE_JWT_SECRET || "fallback-secret"
  const signatureInput = `${randomPart}.${encodedPayload}`
  const signature = createHmac("sha256", secret).update(signatureInput).digest("hex")

  // Combine into final token format: randomPart.encodedPayload.signature
  return `${randomPart}.${encodedPayload}.${signature}`
}
