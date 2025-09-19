import type React from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { getCurrentUser } from "@/lib/auth/get-user"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <ErrorBoundary component="DashboardLayout" showDetails={true}>
      <div className="min-h-screen bg-gray-50 flex">
        <DashboardSidebar user={user} />
        <div className="flex-1 flex flex-col">
          <DashboardHeader user={user} />
          <main className="flex-1 p-6">
            <ErrorBoundary
              component="DashboardContent"
              fallback={
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <h2 className="text-lg font-semibold text-red-800">Layout Error</h2>
                  <p className="text-red-700 mt-2">An error occurred while loading the dashboard layout.</p>
                </div>
              }
            >
              <div className="bg-white p-6 rounded-lg shadow">{children}</div>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}
