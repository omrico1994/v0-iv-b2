import { POST } from "@/app/api/complete-invitation-signup/route"
import { NextRequest } from "next/server"
import jest from "jest"

// Mock UserService
jest.mock("@/lib/services/user-service", () => ({
  UserService: jest.fn().mockImplementation(() => ({
    validateInvitation: jest.fn(),
    createOrUpdateUser: jest.fn(),
    completeInvitation: jest.fn(),
  })),
}))

describe("/api/complete-invitation-signup", () => {
  const testData = {
    token: "test-token",
    email: "test@example.com",
    password: "testpassword123",
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should complete invitation signup successfully", async () => {
    const mockUserService = require("@/lib/services/user-service").UserService
    const mockValidateInvitation = jest.fn().mockResolvedValue({
      valid: true,
      invitation: {
        role: "retailer",
        retailer_id: "retailer-123",
        first_name: "Test",
        last_name: "User",
      },
    })
    const mockCreateOrUpdateUser = jest.fn().mockResolvedValue({
      success: true,
      user: { id: "user-123", email: testData.email },
      redirectUrl: "/dashboard/retailer",
    })
    const mockCompleteInvitation = jest.fn().mockResolvedValue({ success: true })

    mockUserService.mockImplementation(() => ({
      validateInvitation: mockValidateInvitation,
      createOrUpdateUser: mockCreateOrUpdateUser,
      completeInvitation: mockCompleteInvitation,
    }))

    const request = new NextRequest("http://localhost:3000/api/complete-invitation-signup", {
      method: "POST",
      body: JSON.stringify(testData),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.redirectUrl).toBe("/dashboard/retailer")
    expect(data.user).toBeDefined()
    expect(mockValidateInvitation).toHaveBeenCalledWith(testData.token, testData.email)
    expect(mockCreateOrUpdateUser).toHaveBeenCalled()
    expect(mockCompleteInvitation).toHaveBeenCalledWith(testData.token)
  })

  it("should reject invalid invitation", async () => {
    const mockUserService = require("@/lib/services/user-service").UserService
    const mockValidateInvitation = jest.fn().mockResolvedValue({
      valid: false,
      error: "Invalid or expired invitation",
    })

    mockUserService.mockImplementation(() => ({
      validateInvitation: mockValidateInvitation,
      createOrUpdateUser: jest.fn(),
      completeInvitation: jest.fn(),
    }))

    const request = new NextRequest("http://localhost:3000/api/complete-invitation-signup", {
      method: "POST",
      body: JSON.stringify(testData),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Invalid or expired invitation")
  })

  it("should return 400 for missing required fields", async () => {
    const incompleteData = { token: "test-token", email: "test@example.com" } // Missing password

    const request = new NextRequest("http://localhost:3000/api/complete-invitation-signup", {
      method: "POST",
      body: JSON.stringify(incompleteData),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Missing required fields")
  })

  it("should handle user creation failure", async () => {
    const mockUserService = require("@/lib/services/user-service").UserService
    const mockValidateInvitation = jest.fn().mockResolvedValue({
      valid: true,
      invitation: { role: "retailer", retailer_id: "retailer-123" },
    })
    const mockCreateOrUpdateUser = jest.fn().mockResolvedValue({
      success: false,
      error: "Failed to create user",
    })

    mockUserService.mockImplementation(() => ({
      validateInvitation: mockValidateInvitation,
      createOrUpdateUser: mockCreateOrUpdateUser,
      completeInvitation: jest.fn(),
    }))

    const request = new NextRequest("http://localhost:3000/api/complete-invitation-signup", {
      method: "POST",
      body: JSON.stringify(testData),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Failed to create user")
  })
})
