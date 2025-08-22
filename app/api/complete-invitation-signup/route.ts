import { type NextRequest, NextResponse } from "next/server"
import { UserService } from "@/lib/services/user-service"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] API endpoint hit - testing immediate response")

    // Temporary test - return success immediately to verify API is reachable
    return NextResponse.json({
      test: "API is working",
      timestamp: new Date().toISOString(),
      headers: Object.fromEntries(request.headers.entries()),
    })

    console.log("[v0] Raw request received")
    console.log("[v0] Request headers:", Object.fromEntries(request.headers.entries()))

    const body = await request.json()
    console.log("[v0] Parsed request body:", body)
    console.log("[v0] Body type:", typeof body)
    console.log("[v0] Body keys:", Object.keys(body))

    const { token, email, password } = body

    const validationDetails = {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      hasEmail: !!email,
      emailValue: email || "undefined",
      hasPassword: !!password,
      passwordLength: password?.length || 0,
      receivedFields: Object.keys(body),
    }

    console.log("[v0] Complete invitation signup request:", validationDetails)

    if (!token || !email || !password) {
      const missingFields = {
        tokenMissing: !token,
        emailMissing: !email,
        passwordMissing: !password,
      }
      console.log("[v0] Missing required fields:", missingFields)

      return NextResponse.json(
        {
          error: "Missing required fields",
          validation: validationDetails,
          missing: missingFields,
        },
        { status: 400 },
      )
    }

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
    console.error("[v0] Error type:", typeof error)
    console.error("[v0] Error message:", error instanceof Error ? error.message : String(error))

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
