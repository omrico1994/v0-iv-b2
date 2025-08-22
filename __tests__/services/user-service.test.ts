import { UserService } from "@/lib/services/user-service"
import { generateInvitationToken } from "@/lib/utils/secure-tokens"
import jest from "jest" // Declare the jest variable

// Mock Supabase
jest.mock("@/lib/supabase/server", () => ({
  createServiceClient: jest.fn(() => ({
    auth: {
      admin: {
        getUserByEmail: jest.fn(),
        createUser: jest.fn(),
        updateUserById: jest.fn(),
      },
    },
    from: jest.fn(() => ({
      upsert: jest.fn(() => ({ error: null })),
      update: jest.fn(() => ({ error: null })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn(() => ({
              single: jest.fn(() => ({ data: null, error: null })),
            })),
          })),
        })),
      })),
    })),
  })),
}))

describe("UserService", () => {
  let userService: UserService
  const mockSupabase = {
    auth: {
      admin: {
        getUserByEmail: jest.fn(),
        createUser: jest.fn(),
        updateUserById: jest.fn(),
      },
    },
    from: jest.fn(() => ({
      upsert: jest.fn(() => ({ error: null })),
      update: jest.fn(() => ({ error: null })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn(() => ({
              single: jest.fn(() => ({ data: null, error: null })),
            })),
          })),
        })),
      })),
    })),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    userService = new UserService()
    // @ts-ignore - Mock the private supabase property
    userService.supabase = mockSupabase
  })

  describe("createOrUpdateUser", () => {
    const validUserData = {
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      role: "retailer" as const,
      password: "testpassword123",
    }

    it("should create new user when user does not exist", async () => {
      mockSupabase.auth.admin.getUserByEmail.mockResolvedValue({ data: null })
      mockSupabase.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
        error: null,
      })

      const result = await userService.createOrUpdateUser(validUserData)

      expect(result.success).toBe(true)
      expect(result.user?.id).toBe("user-123")
      expect(mockSupabase.auth.admin.createUser).toHaveBeenCalledWith({
        email: validUserData.email,
        email_confirm: true,
        user_metadata: {
          first_name: validUserData.firstName,
          last_name: validUserData.lastName,
          phone: undefined,
          role: validUserData.role,
        },
        password: validUserData.password,
      })
    })

    it("should update existing user when user exists", async () => {
      const existingUser = { user: { id: "existing-123", email: "test@example.com", user_metadata: {} } }
      mockSupabase.auth.admin.getUserByEmail.mockResolvedValue({ data: existingUser })
      mockSupabase.auth.admin.updateUserById.mockResolvedValue({
        data: { user: existingUser.user },
        error: null,
      })

      const result = await userService.createOrUpdateUser(validUserData)

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.admin.updateUserById).toHaveBeenCalledWith(
        "existing-123",
        expect.objectContaining({
          password: validUserData.password,
          email_confirm: true,
        }),
      )
    })

    it("should return error for missing required fields", async () => {
      const invalidData = { ...validUserData, firstName: "" }

      const result = await userService.createOrUpdateUser(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Missing required fields")
    })

    it("should handle user creation errors", async () => {
      mockSupabase.auth.admin.getUserByEmail.mockResolvedValue({ data: null })
      mockSupabase.auth.admin.createUser.mockResolvedValue({
        data: null,
        error: { message: "Email already exists" },
      })

      const result = await userService.createOrUpdateUser(validUserData)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Email already exists")
    })
  })

  describe("validateInvitation", () => {
    const testEmail = "test@example.com"

    it("should validate valid invitation token and database record", async () => {
      const { token } = generateInvitationToken(testEmail)
      const mockInvitation = {
        id: "inv-123",
        email: testEmail,
        status: "sent",
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }

      mockSupabase.from().select().eq().eq().in().single.mockResolvedValue({
        data: mockInvitation,
        error: null,
      })

      const result = await userService.validateInvitation(token, testEmail)

      expect(result.valid).toBe(true)
      expect(result.invitation).toEqual(mockInvitation)
    })

    it("should reject invalid token", async () => {
      const result = await userService.validateInvitation("invalid-token", testEmail)

      expect(result.valid).toBe(false)
      expect(result.error).toBe("Invalid invitation token")
    })

    it("should reject expired token", async () => {
      const { token } = generateInvitationToken(testEmail, -1) // Expired

      const result = await userService.validateInvitation(token, testEmail)

      expect(result.valid).toBe(false)
      expect(result.error).toBe("Invitation has expired")
    })
  })

  describe("completeInvitation", () => {
    it("should successfully complete invitation", async () => {
      const token = "test-token"

      const result = await userService.completeInvitation(token)

      expect(result.success).toBe(true)
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        status: "accepted",
        accepted_at: expect.any(String),
      })
    })

    it("should handle completion errors", async () => {
      const token = "test-token"
      mockSupabase.from().update.mockReturnValue({
        eq: jest.fn(() => ({ error: { message: "Update failed" } })),
      })

      const result = await userService.completeInvitation(token)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Failed to complete invitation")
    })
  })
})
