import type React from "react"
import { getCurrentUser } from "@/lib/auth/get-user"
import { UserInfo } from "@/components/dashboard/user-info"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return (
        <div className="min-h-screen bg-blue-50 p-4">
          <div className="max-w-md mx-auto mt-20">
            <div className="bg-white p-6 rounded-lg shadow">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
              <p className="text-gray-600 mb-4">Please log in to access the dashboard.</p>
              <a href="/auth/login" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Go to Login
              </a>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
          <UserInfo user={user} />
          <div className="bg-white p-4 rounded-lg shadow">{children}</div>
        </div>
      </div>
    )
  } catch (error) {
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
