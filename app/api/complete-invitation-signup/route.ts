import { type NextRequest, NextResponse } from "next/server"
import { UserService } from "@/lib/services/user-service"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] API endpoint called - parsing request body...")

    const rawBody = await request.text()
    console.log("[v0] Raw request body as text:", rawBody.substring(0, 200) + "...")

    // Parse the JSON from the raw text
    const body = JSON.parse(rawBody)
    console.log("[v0] Raw request body parsed successfully")

    const { token, email, password } = body

    console.log("[v0] Field extraction results:", {
      tokenExists: "token" in body,
      emailExists: "email" in body,
      passwordExists: "password" in body,
      tokenValue: token ? `${token.substring(0, 20)}...` : `"${token}"`,
      emailValue: `"${email}"`,
      passwordValue: password ? `[${password.length} chars]` : `"${password}"`,
      tokenTruthy: !!token,
      emailTruthy: !!email,
      passwordTruthy: !!password,
    })

    if (!token || !email || !password) {
      console.log("[v0] Missing required fields - detailed check:", {
        tokenMissing: !token,
        emailMissing: !email,
        passwordMissing: !password,
        tokenValue: token,
        emailValue: email,
        passwordValue: password ? "[REDACTED]" : null,
      })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("[v0] Complete invitation signup request:", { token: !!token, email, hasPassword: !!password })

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    const userService = new UserService()

    console.log("[v0] Validating invitation...")
    const validation = await userService.validateInvitation(token, email)

    if (!validation.valid) {
      console.log("[v0] Invitation validation failed:", validation.error)
      const statusCode = validation.error?.includes("expired") ? 410 : 400
      return NextResponse.json({ error: validation.error }, { status: statusCode })
    }

    const invitation = validation.invitation!

    console.log("[v0] Creating/updating user...")
    const result = await userService.createOrUpdateUser({
      email: email,
      firstName: invitation.first_name || email.split("@")[0],
      lastName: invitation.last_name || "",
      phone: invitation.phone,
      role: invitation.role === "location" ? "location_user" : invitation.role,
      retailerId: invitation.retailer_id,
      password: password,
      invitationToken: token,
    })

    if (!result.success) {
      console.log("[v0] User creation/update failed:", result.error)
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    console.log("[v0] Completing invitation...")
    const completion = await userService.completeInvitation(token)

    if (!completion.success) {
      console.error("[v0] Invitation completion failed:", completion.error)
      // Don't fail the entire operation for this
    }

    console.log("[v0] Account setup completed successfully")

    return NextResponse.json({
      success: true,
      redirectUrl: result.redirectUrl,
      message: "Account setup completed successfully",
      user: result.user,
    })
  } catch (error) {
    console.error("[v0] Complete invitation signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
