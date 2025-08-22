import { type NextRequest, NextResponse } from "next/server"
import { UserService } from "@/lib/services/user-service"

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json()

    console.log("[v0] Validation request received:", { token, email })

    if (!token || !email) {
      return NextResponse.json({ valid: false, error: "Token and email are required" }, { status: 400 })
    }

    const userService = new UserService()

    const validation = await userService.validateInvitation(token, email)

    if (!validation.valid) {
      const statusCode = validation.error?.includes("expired") ? 410 : 404
      return NextResponse.json({ valid: false, error: validation.error }, { status: statusCode })
    }

    console.log("[v0] Invitation validation successful")
    return NextResponse.json({ valid: true, invitation: validation.invitation })
  } catch (error) {
    console.error("[v0] Invitation validation error:", error)
    return NextResponse.json({ valid: false, error: "Internal server error" }, { status: 500 })
  }
}
