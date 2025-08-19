import { getCurrentUser } from "@/lib/auth/get-user"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  let user = null
  let error = null

  try {
    user = await getCurrentUser()
  } catch (err) {
    error = err
    console.log("[v0] Dashboard page caught error:", err)
  }

  // If there's a database error, show a fallback UI
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-yellow-800">Database Setup Required</h2>
          <p className="text-yellow-700 mt-2">
            The user authentication system needs to be configured. Please contact your administrator.
          </p>
        </div>
      </div>
    )
  }

  // If no user found, show login prompt
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-800">Authentication Required</h2>
          <p className="text-blue-700 mt-2">Please log in to access the dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your dashboard, {user.first_name || user.email}</p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-green-800">Authentication Successful</h2>
        <div className="mt-2 text-green-700">
          <p>Email: {user.email}</p>
          <p>Role: {user.role}</p>
          <p>User ID: {user.id}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Quick Actions</h2>
          <p className="text-gray-600">Access your most common tasks and features.</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Recent Activity</h2>
          <p className="text-gray-600">View your recent system activity and updates.</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">System Status</h2>
          <p className="text-gray-600">Monitor system health and performance.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Getting Started</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 border rounded-lg bg-gray-50">
            <h3 className="font-medium text-gray-900">Setup Complete</h3>
            <p className="text-sm text-gray-600 mt-1">Your authentication system is working properly.</p>
          </div>
          <div className="p-4 border rounded-lg bg-gray-50">
            <h3 className="font-medium text-gray-900">Next Steps</h3>
            <p className="text-sm text-gray-600 mt-1">Ready to build system features with role-based access control.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
