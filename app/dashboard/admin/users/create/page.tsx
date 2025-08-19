import { Suspense } from "react"
import { UserCreationForm } from "@/components/admin/user-creation-form"

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

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }
      >
        <UserCreationForm />
      </Suspense>
    </div>
  )
}
