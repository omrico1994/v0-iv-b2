import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const startTime = Date.now()

  try {
    // Check database connectivity
    const supabase = createClient()
    const { error: dbError } = await supabase.from("user_profiles").select("count").limit(1).single()

    const responseTime = Date.now() - startTime

    // Determine health status
    const isHealthy = !dbError && responseTime < 1000

    const healthData = {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: dbError ? "fail" : "pass",
          responseTime: `${responseTime}ms`,
          error: dbError?.message,
        },
        api: {
          status: "pass",
          responseTime: `${responseTime}ms`,
        },
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || "unknown",
    }

    return NextResponse.json(healthData, {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    )
  }
}
