import crypto from "crypto"

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential XSS characters
    .slice(0, 1000) // Limit length
}

export function sanitizeEmail(email: string): string {
  return email
    .toLowerCase()
    .trim()
    .replace(/[^\w@.-]/g, "") // Only allow valid email characters
}

// Password validation
export interface PasswordValidation {
  isValid: boolean
  errors: string[]
  strength: "weak" | "medium" | "strong"
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = []
  let score = 0

  // Length check
  if (password.length < 12) {
    errors.push("Password must be at least 12 characters long")
  } else {
    score += 1
  }

  // Character variety checks
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  } else {
    score += 1
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  } else {
    score += 1
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number")
  } else {
    score += 1
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character")
  } else {
    score += 1
  }

  // Common password check
  const commonPasswords = [
    "password",
    "123456",
    "password123",
    "admin",
    "qwerty",
    "letmein",
    "welcome",
    "monkey",
    "1234567890",
  ]

  if (commonPasswords.some((common) => password.toLowerCase().includes(common))) {
    errors.push("Password contains common words or patterns")
    score = Math.max(0, score - 2)
  }

  // Determine strength
  let strength: "weak" | "medium" | "strong" = "weak"
  if (score >= 4 && errors.length === 0) {
    strength = "strong"
  } else if (score >= 3) {
    strength = "medium"
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  }
}

// Generate secure tokens
export function generateSecureToken(length = 32): string {
  return crypto.randomBytes(length).toString("hex")
}

// Hash sensitive data
export function hashData(data: string, salt?: string): string {
  const actualSalt = salt || crypto.randomBytes(16).toString("hex")
  const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, "sha512")
  return `${actualSalt}:${hash.toString("hex")}`
}

export function verifyHash(data: string, hash: string): boolean {
  const [salt, originalHash] = hash.split(":")
  const newHash = crypto.pbkdf2Sync(data, salt, 10000, 64, "sha512")
  return originalHash === newHash.toString("hex")
}

// IP address utilities
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")
  const remoteAddr = request.headers.get("remote-addr")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  return realIP || remoteAddr || "unknown"
}

// Session security
export function generateSessionId(): string {
  return crypto.randomBytes(32).toString("base64url")
}

// CSRF token generation
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("base64url")
}

// Timing-safe string comparison
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  return crypto.timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"))
}
