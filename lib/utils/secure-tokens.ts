import { SignJWT, jwtVerify } from "jose"

export interface SecureToken {
  token: string
  expiresAt: Date
}

export interface TokenValidation {
  isValid: boolean
  isExpired: boolean
  payload?: any
}

export async function generateInvitationToken(email: string, expirationDays = 7): Promise<SecureToken> {
  const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000)

  const payload = {
    email,
    type: "invitation",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(expiresAt.getTime() / 1000),
  }

  const secret = new TextEncoder().encode(
    process.env.INVITATION_TOKEN_SECRET || process.env.SUPABASE_JWT_SECRET || "fallback-secret",
  )

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(payload.exp)
    .sign(secret)

  return {
    token,
    expiresAt,
  }
}

export async function validateInvitationToken(token: string, email: string): Promise<TokenValidation> {
  try {
    const secret = new TextEncoder().encode(
      process.env.INVITATION_TOKEN_SECRET || process.env.SUPABASE_JWT_SECRET || "fallback-secret",
    )

    const { payload } = await jwtVerify(token, secret)

    // Check email match
    if (payload.email !== email) {
      return { isValid: false, isExpired: false }
    }

    // Check if token is expired (JWT library handles this, but we check manually for consistency)
    const now = Math.floor(Date.now() / 1000)
    const isExpired = now > (payload.exp as number)

    return {
      isValid: true,
      isExpired,
      payload,
    }
  } catch (error) {
    // JWT verification failed (invalid signature, expired, etc.)
    return { isValid: false, isExpired: true }
  }
}

export async function createSecureInvitationToken(payload: {
  email: string
  invitedBy: string
  exp?: number
}): Promise<string> {
  const expirationTime = payload.exp
    ? payload.exp < 10000000000
      ? payload.exp
      : Math.floor(payload.exp / 1000)
    : Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000) // 7 days default

  const jwtPayload = {
    email: payload.email,
    invitedBy: payload.invitedBy,
    type: "invitation",
    iat: Math.floor(Date.now() / 1000),
    exp: expirationTime,
  }

  const secret = new TextEncoder().encode(
    process.env.INVITATION_TOKEN_SECRET || process.env.SUPABASE_JWT_SECRET || "fallback-secret",
  )

  const token = await new SignJWT(jwtPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(secret)

  return token
}
