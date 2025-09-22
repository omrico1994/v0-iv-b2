import { type NextRequest, NextResponse } from "next/server"
import { UserService } from "@/lib/services/user-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, email, password } = body

    const missingFields = []
    if (!token) missingFields.push("token")
    if (!email) missingFields.push("email")
    if (!password) missingFields.push("password")

    if (missingFields.length > 0) {
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

    const validation = await userService.validateInvitation(token, email)

    if (!validation.valid) {
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

    const result = await userService.createOrUpdateUser({
      email: email,
      firstName: invitation.first_name || email.split("@")[0],
      lastName: invitation.last_name || "",
      phone: invitation.phone,
      role: invitation.role === "location" ? "location_user" : invitation.role,
      retailerId: invitation.retailer_id,
      password: password,
      invitationToken: token,
      isInvitationAcceptance: true,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "User creation failed",
          code: "USER_CREATION_FAILED",
          details: result.details || undefined,
        },
        { status: 400 },
      )
    }

    const completion = await userService.completeInvitation(token)
    if (!completion.success) {
      console.error("Invitation completion failed:", completion.error)
    }

    return NextResponse.json({
      success: true,
      redirectUrl: result.redirectUrl,
      message: "Account setup completed successfully",
      user: result.user,
    })
  } catch (error) {
    console.error("Complete invitation signup error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    )
  }
}
