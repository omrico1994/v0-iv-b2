import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Test API: Starting account creation test")

    const { email, password } = await request.json()
    console.log("[v0] Test API: Received data:", { email, passwordLength: password?.length })

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Create user with admin API
    console.log("[v0] Test API: Creating user with admin API")
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "retailer",
        invitation_completed: true,
      },
    })

    if (authError) {
      console.log("[v0] Test API: Auth error:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    console.log("[v0] Test API: User created successfully:", authUser.user.id)

    return NextResponse.json({
      success: true,
      userId: authUser.user.id,
      message: "Account created successfully",
    })
  } catch (error) {
    console.error("[v0] Test API: Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
