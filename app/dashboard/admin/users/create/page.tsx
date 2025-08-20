import { Suspense } from "react"
import { UserCreationForm } from "@/components/admin/user-creation-form"
import { ErrorBoundary } from "@/components/error-boundary"

export const dynamic = "force-dynamic"

export default function CreateUserPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground mb-2">Create New User</h1>
        <p className="text-muted-foreground">
          Add a new user to the system with appropriate role and business assignments.
        </p>
      </div>

      <ErrorBoundary
        fallback={
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-yellow-800">Loading Error</h2>
            <p className="text-yellow-700 mt-2">
              There was an issue loading the user creation form. Please refresh the page.
            </p>
          </div>
        }
      >
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }
        >
          <UserCreationForm />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
