import { type NextRequest, NextResponse } from "next/server"
import { UserService } from "@/lib/services/user-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, email, password } = body

    console.log("[v0] Complete invitation signup request v2.0:", {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenType: typeof token,
      email,
      emailType: typeof email,
      hasPassword: !!password,
      passwordLength: password?.length || 0,
      passwordType: typeof password,
      rawBody: JSON.stringify(body).substring(0, 200) + "...",
    })

    const missingFields = []
    if (!token) missingFields.push("token")
    if (!email) missingFields.push("email")
    if (!password) missingFields.push("password")

    if (missingFields.length > 0) {
      console.log("[v0] Missing fields detected:", missingFields)
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          missing: missingFields,
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 8 characters long",
          code: "PASSWORD_TOO_SHORT",
        },
        { status: 400 },
      )
    }

    const userService = new UserService()

    console.log("[v0] Validating invitation...")
    const validation = await userService.validateInvitation(token, email)

    if (!validation.valid) {
      console.log("[v0] Invitation validation failed:", validation.error)
      const statusCode = validation.error?.includes("expired") ? 410 : 400
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          code: validation.error?.includes("expired") ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
        },
        { status: statusCode },
      )
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
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          code: "USER_CREATION_FAILED",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Completing invitation...")
    const completion = await userService.completeInvitation(token)
    if (!completion.success) {
      console.error("[v0] Invitation completion failed:", completion.error)
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
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    )
  }
}
