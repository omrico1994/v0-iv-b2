import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "No token provided" })
  }

  console.log("[v0] Debug token analysis starting...")
  console.log("[v0] Token:", token)

  try {
    // Split the token into parts
    const parts = token.split(".")
    console.log("[v0] Token parts count:", parts.length)
    console.log("[v0] Parts:", parts)

    if (parts.length !== 3) {
      return NextResponse.json({
        error: "Invalid token format",
        parts: parts.length,
        token,
      })
    }

    const [randomPart, payloadPart, signaturePart] = parts

    // Decode the payload
    let decodedPayload
    try {
      const payloadString = Buffer.from(payloadPart, "base64").toString("utf-8")
      console.log("[v0] Decoded payload string:", payloadString)
      decodedPayload = JSON.parse(payloadString)
      console.log("[v0] Parsed payload:", decodedPayload)
    } catch (error) {
      console.log("[v0] Payload decode error:", error)
      return NextResponse.json({
        error: "Failed to decode payload",
        payloadPart,
        decodeError: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Check expiration
    const now = Date.now()
    const isExpired = decodedPayload.exp && now > decodedPayload.exp
    console.log("[v0] Current time:", now)
    console.log("[v0] Token expiry:", decodedPayload.exp)
    console.log("[v0] Is expired:", isExpired)

    // Check if INVITATION_TOKEN_SECRET exists
    const secret = process.env.INVITATION_TOKEN_SECRET
    console.log("[v0] Secret exists:", !!secret)
    console.log("[v0] Secret length:", secret?.length || 0)

    return NextResponse.json({
      success: true,
      analysis: {
        partsCount: parts.length,
        randomPart,
        payloadPart,
        signaturePart,
        decodedPayload,
        isExpired,
        currentTime: now,
        hasSecret: !!secret,
        secretLength: secret?.length || 0,
      },
    })
  } catch (error) {
    console.log("[v0] Token analysis error:", error)
    return NextResponse.json({
      error: "Token analysis failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
