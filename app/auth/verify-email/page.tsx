"use client"

import { useSearchParams } from "next/navigation"
import { EmailVerificationStatus } from "@/components/email/email-verification-status"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <EmailVerificationStatus
        email={email || undefined}
        onResendVerification={() => {
          console.log("Verification email resent")
        }}
      />
    </div>
  )
}
