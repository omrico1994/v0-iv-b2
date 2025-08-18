import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-user"

export default async function HomePage() {
  const user = await getCurrentUser()

  // If user is not authenticated, middleware should handle redirect to login
  // This is a fallback in case middleware doesn't catch it
  if (!user) {
    redirect("/auth/login")
  }

  // If user has a role, redirect to appropriate dashboard
  if (user.role) {
    redirect(`/dashboard/${user.role}`)
  }

  // User is authenticated but has no role - show access pending
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access pending</h1>
          <p className="text-gray-600">
            Your account is active but not yet assigned a role. Please contact your administrator to complete setup.
          </p>
        </div>
      </div>
    </div>
  )
}
