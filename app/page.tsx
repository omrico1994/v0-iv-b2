import { redirect } from "next/navigation"
import { getCurrentUserContext } from "@/lib/auth/getCurrentUserContext"

export default async function HomePage() {
  const userContext = await getCurrentUserContext()

  if (!userContext) {
    // User is not authenticated, redirect to login
    redirect("/auth/login")
  }

  if (!userContext.role) {
    // User is authenticated but has no role assigned
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

  // User is authenticated and has a role, redirect to appropriate dashboard
  redirect(`/dashboard/${userContext.role}`)
}
