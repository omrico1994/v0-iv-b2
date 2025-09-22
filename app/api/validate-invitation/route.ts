import { type NextRequest, NextResponse } from "next/server"
import { UserService } from "@/lib/services/user-service"

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json()

    if (!token || !email) {
      return NextResponse.json({ valid: false, error: "Token and email are required" }, { status: 400 })
    }

    const userService = new UserService()

    const validation = await userService.validateInvitation(token, email)

    if (!validation.valid) {
      const statusCode = validation.error?.includes("expired") ? 410 : validation.error?.includes("Invalid") ? 404 : 400
      return NextResponse.json({ valid: false, error: validation.error }, { status: statusCode })
    }

    return NextResponse.json({ valid: true, invitation: validation.invitation })
  } catch (error) {
    console.error("Invitation validation error:", error)
    return NextResponse.json({ valid: false, error: "Internal server error" }, { status: 500 })
  }
}
