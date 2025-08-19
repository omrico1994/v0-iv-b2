import { Suspense } from "react"
import { AccountSetupForm } from "@/components/auth/account-setup-form"

export const dynamic = "force-dynamic"

export default function SetupAccountPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Complete Your Account Setup</h1>
          <p className="text-muted-foreground">Set your password and complete your profile to get started.</p>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }
        >
          <AccountSetupForm />
        </Suspense>
      </div>
    </div>
  )
}
