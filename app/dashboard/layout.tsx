import type React from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <h2 className="text-lg font-semibold mb-2">User Info</h2>
          <p>Email: admin@iv-relife.com</p>
          <p>Role: admin</p>
          <p>Status: Ultra-minimal layout</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">{children}</div>
      </div>
    </div>
  )
}
