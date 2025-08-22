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
    console.log("[v0] Starting token validation")
    console.log("[v0] Token:", token)
    console.log("[v0] Email:", email)

    const parts = token.split(".")
    if (parts.length !== 3) {
      console.log("[v0] Invalid token format - expected 3 parts, got:", parts.length)
      return { isValid: false, isExpired: false }
    }

    const [randomPart, payloadPart, signature] = parts
    console.log("[v0] Token parts:")
    console.log("[v0] Random part:", randomPart)
    console.log("[v0] Payload part:", payloadPart)
    console.log("[v0] Signature:", signature)

    // Decode payload
    const payloadString = Buffer.from(payloadPart, "base64").toString("utf-8")
    console.log("[v0] Decoded payload string:", payloadString)

    const payload = JSON.parse(payloadString)
    console.log("[v0] Parsed payload:", payload)

    const secret = process.env.INVITATION_TOKEN_SECRET || process.env.SUPABASE_JWT_SECRET || "fallback-secret"
    console.log("[v0] Using secret (first 10 chars):", secret.substring(0, 10))

    const signatureInput = `${randomPart}.${payloadPart}`
    console.log("[v0] Signature input:", signatureInput)

    const expectedSignature = createHmac("sha256", secret).update(signatureInput).digest("hex")
    console.log("[v0] Expected signature:", expectedSignature)
    console.log("[v0] Received signature:", signature)

    if (signature !== expectedSignature) {
      console.log("[v0] Token signature validation failed")
      console.log("[v0] Signature mismatch!")
      return { isValid: false, isExpired: false }
    }

    // Check email match
    if (payload.email !== email) {
      console.log("[v0] Token email mismatch")
      console.log("[v0] Payload email:", payload.email)
      console.log("[v0] Expected email:", email)
      return { isValid: false, isExpired: false }
    }

    // Check expiration
    const now = Date.now()
    const isExpired = now > payload.exp
    console.log("[v0] Current time:", now)
    console.log("[v0] Token expires at:", payload.exp)
    console.log("[v0] Is expired:", isExpired)

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

  const expInMilliseconds = payload.exp < 10000000000 ? payload.exp * 1000 : payload.exp

  // Create the payload string with corrected expiration
  const correctedPayload = {
    ...payload,
    exp: expInMilliseconds,
  }
  const payloadString = JSON.stringify(correctedPayload)
  const encodedPayload = Buffer.from(payloadString).toString("base64")

  // Sign the token with HMAC to prevent tampering
  const secret = process.env.INVITATION_TOKEN_SECRET || process.env.SUPABASE_JWT_SECRET || "fallback-secret"
  console.log("[v0] Using secret (first 10 chars):", secret.substring(0, 10))

  const signatureInput = `${randomPart}.${encodedPayload}`
  console.log("[v0] Signature input:", signatureInput)

  const signature = createHmac("sha256", secret).update(signatureInput).digest("hex")
  console.log("[v0] Generated signature:", signature)

  // Combine into final token format: randomPart.encodedPayload.signature
  const secureToken = `${randomPart}.${encodedPayload}.${signature}`
  console.log("[v0] Final secure token:", secureToken)

  return secureToken
}
