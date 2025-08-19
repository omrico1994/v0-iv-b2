import type React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-user"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log("[v0] Dashboard layout starting...")

  try {
    console.log("[v0] Calling getCurrentUser...")
    const user = await getCurrentUser()
    console.log("[v0] getCurrentUser result:", user ? "User found" : "No user")

    if (user) {
      console.log("[v0] User details:", {
        id: user.id,
        email: user.email,
        role: user.role,
        hasLocationMemberships: user.locations?.length > 0,
      })
    }

    if (!user) {
      console.log("[v0] No user found, redirecting to login...")
      redirect("/auth/login")
    }

    console.log("[v0] Rendering dashboard layout...")
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <h2 className="text-lg font-semibold mb-2">User Info</h2>
            <p>Email: {user.email}</p>
            <p>Role: {user.role}</p>
            <p>ID: {user.id}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">{children}</div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("[v0] Dashboard layout error:", error)

    const errorMessage = String(error)
    const isDatabaseError =
      errorMessage.includes("relation") || errorMessage.includes("table") || errorMessage.includes("does not exist")

    if (isDatabaseError) {
      return (
        <div className="min-h-screen bg-yellow-50 p-4">
          <h1 className="text-2xl font-bold text-yellow-900 mb-4">Database Setup Required</h1>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-yellow-600 mb-4">The database tables haven't been created yet.</p>
            <p className="text-sm text-gray-600 mb-4">Please run the database setup scripts first:</p>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
              <li>01_create_enums_and_tables.sql</li>
              <li>02_create_constraint_functions.sql</li>
              <li>03_create_rls_helper_functions.sql</li>
              <li>04_enable_rls_and_create_policies.sql</li>
              <li>05_create_audit_system.sql</li>
              <li>06_create_sample_data.sql</li>
            </ol>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-red-50 p-4">
        <h1 className="text-2xl font-bold text-red-900 mb-4">Dashboard Error</h1>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-red-600">An error occurred loading the dashboard.</p>
          <pre className="mt-2 text-sm text-gray-600">{errorMessage}</pre>
        </div>
      </div>
    )
  }
}
