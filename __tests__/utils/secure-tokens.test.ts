import { generateInvitationToken, validateInvitationToken, generateSecureToken } from "@/lib/utils/secure-tokens"

describe("Secure Tokens", () => {
  const testEmail = "test@example.com"

  beforeAll(() => {
    // Set test environment variables
    process.env.INVITATION_TOKEN_SECRET = "test-secret-key-for-testing"
  })

  describe("generateInvitationToken", () => {
    it("should generate a valid token with correct structure", () => {
      const result = generateInvitationToken(testEmail)

      expect(result.token).toBeDefined()
      expect(result.expiresAt).toBeInstanceOf(Date)
      expect(result.token.split(".")).toHaveLength(3) // randomPart.payload.signature
    })

    it("should generate different tokens for same email", () => {
      const token1 = generateInvitationToken(testEmail)
      const token2 = generateInvitationToken(testEmail)

      expect(token1.token).not.toBe(token2.token)
    })

    it("should respect custom expiration hours", () => {
      const customHours = 48
      const result = generateInvitationToken(testEmail, customHours)

      const expectedExpiration = new Date(Date.now() + customHours * 60 * 60 * 1000)
      const timeDiff = Math.abs(result.expiresAt.getTime() - expectedExpiration.getTime())

      expect(timeDiff).toBeLessThan(1000) // Within 1 second
    })
  })

  describe("validateInvitationToken", () => {
    it("should validate a valid token", () => {
      const { token } = generateInvitationToken(testEmail)
      const validation = validateInvitationToken(token, testEmail)

      expect(validation.isValid).toBe(true)
      expect(validation.isExpired).toBe(false)
      expect(validation.payload).toBeDefined()
      expect(validation.payload?.email).toBe(testEmail)
    })

    it("should reject token with wrong email", () => {
      const { token } = generateInvitationToken(testEmail)
      const validation = validateInvitationToken(token, "wrong@example.com")

      expect(validation.isValid).toBe(false)
      expect(validation.isExpired).toBe(false)
    })

    it("should reject malformed token", () => {
      const validation = validateInvitationToken("invalid-token", testEmail)

      expect(validation.isValid).toBe(false)
    })

    it("should detect expired token", () => {
      // Generate token that expires immediately
      const { token } = generateInvitationToken(testEmail, -1) // -1 hour (expired)
      const validation = validateInvitationToken(token, testEmail)

      expect(validation.isValid).toBe(true) // Structure is valid
      expect(validation.isExpired).toBe(true) // But expired
    })

    it("should reject tampered token", () => {
      const { token } = generateInvitationToken(testEmail)
      const parts = token.split(".")
      const tamperedToken = `${parts[0]}.${parts[1]}.tampered-signature`

      const validation = validateInvitationToken(tamperedToken, testEmail)

      expect(validation.isValid).toBe(false)
    })
  })

  describe("generateSecureToken", () => {
    it("should generate a 64-character hex string", () => {
      const token = generateSecureToken()

      expect(token).toHaveLength(64)
      expect(token).toMatch(/^[a-f0-9]+$/)
    })

    it("should generate unique tokens", () => {
      const token1 = generateSecureToken()
      const token2 = generateSecureToken()

      expect(token1).not.toBe(token2)
    })
  })
})
