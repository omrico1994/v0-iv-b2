import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json()

    // Validate error data
    if (!errorData.message || !errorData.timestamp) {
      return NextResponse.json({ error: "Invalid error data" }, { status: 400 })
    }

    const supabase = createClient()

    // Get user if authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Log error to database
    const { error } = await supabase.from("audit_logs").insert({
      user_id: user?.id || null,
      action: "client_error",
      metadata: {
        type: errorData.type || "javascript-error",
        message: errorData.message,
        stack: errorData.stack,
        filename: errorData.filename,
        lineno: errorData.lineno,
        colno: errorData.colno,
        userAgent: errorData.userAgent,
        url: errorData.url,
        timestamp: errorData.timestamp,
      },
    })

    if (error) {
      console.error("Failed to log error to database:", error)
      return NextResponse.json({ error: "Failed to log error" }, { status: 500 })
    }

    // In production, you might also send to external monitoring services
    // await sendToMonitoringService(errorData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error logging endpoint failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
