import type React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-user"
// import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
// import { DashboardHeader } from "@/components/dashboard/dashboard-header"

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
        hasLocationMemberships: user.location_memberships?.length > 0,
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
    return (
      <div className="min-h-screen bg-red-50 p-4">
        <h1 className="text-2xl font-bold text-red-900 mb-4">Dashboard Error</h1>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-red-600">An error occurred loading the dashboard.</p>
          <pre className="mt-2 text-sm text-gray-600">{String(error)}</pre>
        </div>
      </div>
    )
  }
}
