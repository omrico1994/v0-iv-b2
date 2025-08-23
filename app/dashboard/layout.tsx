import type React from "react"
import { ErrorBoundary } from "@/components/error-boundary"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary component="DashboardLayout" showDetails={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="p-4">
          <ErrorBoundary
            component="DashboardContent"
            fallback={
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h2 className="text-lg font-semibold text-red-800">Layout Error</h2>
                <p className="text-red-700 mt-2">An error occurred while loading the dashboard layout.</p>
              </div>
            }
          >
            <div className="bg-white p-4 rounded-lg shadow">{children}</div>
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  )
}
