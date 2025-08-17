import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Get client IP address for rate limiting
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown"

  return NextResponse.json({ ip })
}
