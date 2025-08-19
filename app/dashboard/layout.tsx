import type React from "react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log("[v0] Dashboard layout starting...")

  try {
    console.log("[v0] Rendering minimal dashboard...")

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <h2 className="text-lg font-semibold mb-2">User Info</h2>
            <p>Email: admin@iv-relife.com</p>
            <p>Role: admin</p>
            <p>Status: Testing minimal layout</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">{children}</div>
        </div>
      </div>
    )
  } catch (error) {
    console.log("[v0] Dashboard layout caught error:", error)

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
