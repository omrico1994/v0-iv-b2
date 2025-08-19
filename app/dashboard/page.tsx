import { getCurrentUser } from "@/lib/auth/get-user"
import { hasPermission } from "@/lib/auth/authorization"
import { PERMISSIONS } from "@/lib/auth/permissions"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your dashboard</p>
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Role-Based Access Test</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="font-medium">User Management</span>
            <span
              className={`px-2 py-1 rounded text-sm ${
                hasPermission(user.role, PERMISSIONS.MANAGE_USERS)
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {hasPermission(user.role, PERMISSIONS.MANAGE_USERS) ? "Allowed" : "Denied"}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="font-medium">View Claims (Admin/Office Only)</span>
            <span
              className={`px-2 py-1 rounded text-sm ${
                hasPermission(user.role, PERMISSIONS.VIEW_CLAIMS)
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {hasPermission(user.role, PERMISSIONS.VIEW_CLAIMS) ? "Allowed" : "Denied"}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="font-medium">Create Orders</span>
            <span
              className={`px-2 py-1 rounded text-sm ${
                hasPermission(user.role, PERMISSIONS.CREATE_ORDERS)
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {hasPermission(user.role, PERMISSIONS.CREATE_ORDERS) ? "Allowed" : "Denied"}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="font-medium">Handle Repairs</span>
            <span
              className={`px-2 py-1 rounded text-sm ${
                hasPermission(user.role, PERMISSIONS.HANDLE_REPAIRS)
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {hasPermission(user.role, PERMISSIONS.HANDLE_REPAIRS) ? "Allowed" : "Denied"}
            </span>
          </div>
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
            <p className="text-sm text-gray-600 mt-1">Customize your dashboard and add more features.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
