import { POST } from "@/app/api/validate-invitation/route"
import { NextRequest } from "next/server"
import { generateInvitationToken } from "@/lib/utils/secure-tokens"
import jest from "jest"

// Mock UserService
jest.mock("@/lib/services/user-service", () => ({
  UserService: jest.fn().mockImplementation(() => ({
    validateInvitation: jest.fn(),
  })),
}))

describe("/api/validate-invitation", () => {
  const testEmail = "test@example.com"

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should validate valid invitation", async () => {
    const { token } = generateInvitationToken(testEmail)
    const mockUserService = require("@/lib/services/user-service").UserService
    const mockValidateInvitation = jest.fn().mockResolvedValue({
      valid: true,
      invitation: { id: "inv-123", email: testEmail, status: "sent" },
    })
    mockUserService.mockImplementation(() => ({
      validateInvitation: mockValidateInvitation,
    }))

    const request = new NextRequest("http://localhost:3000/api/validate-invitation", {
      method: "POST",
      body: JSON.stringify({ token, email: testEmail }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.valid).toBe(true)
    expect(data.invitation).toBeDefined()
    expect(mockValidateInvitation).toHaveBeenCalledWith(token, testEmail)
  })

  it("should reject invalid invitation", async () => {
    const mockUserService = require("@/lib/services/user-service").UserService
    const mockValidateInvitation = jest.fn().mockResolvedValue({
      valid: false,
      error: "Invalid invitation token",
    })
    mockUserService.mockImplementation(() => ({
      validateInvitation: mockValidateInvitation,
    }))

    const request = new NextRequest("http://localhost:3000/api/validate-invitation", {
      method: "POST",
      body: JSON.stringify({ token: "invalid-token", email: testEmail }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.valid).toBe(false)
    expect(data.error).toBe("Invalid invitation token")
  })

  it("should return 400 for missing parameters", async () => {
    const request = new NextRequest("http://localhost:3000/api/validate-invitation", {
      method: "POST",
      body: JSON.stringify({ token: "test-token" }), // Missing email
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.valid).toBe(false)
    expect(data.error).toBe("Token and email are required")
  })

  it("should return 410 for expired invitation", async () => {
    const mockUserService = require("@/lib/services/user-service").UserService
    const mockValidateInvitation = jest.fn().mockResolvedValue({
      valid: false,
      error: "Invitation has expired",
    })
    mockUserService.mockImplementation(() => ({
      validateInvitation: mockValidateInvitation,
    }))

    const request = new NextRequest("http://localhost:3000/api/validate-invitation", {
      method: "POST",
      body: JSON.stringify({ token: "expired-token", email: testEmail }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(410)
    expect(data.valid).toBe(false)
    expect(data.error).toBe("Invitation has expired")
  })
})
