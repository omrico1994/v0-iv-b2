"use client"

import { useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

import { useAuthInitialization } from "./hooks/use-auth-initialization"
import { PasswordForm } from "./components/password-form"
import { ErrorDisplay } from "./components/error-display"
import { ExpiredLinkCard } from "./components/expired-link-card"

export function AccountSetupForm() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const {
    isInitialized,
    isPasswordReset,
    isLinkExpired,
    isInvitationFlow,
    userEmail,
    invitationToken,
    error,
    recoveryActions,
    handleError,
    clearError,
  } = useAuthInitialization()

  const handleRecoveryAction = (action: string) => {
    switch (action) {
      case "request_invitation":
        router.push("/auth/request-invitation")
        break
      case "sign_in":
        router.push("/auth/login")
        break
      case "reset_password":
        router.push("/auth/reset-password")
        break
      case "retry":
        clearError()
        break
      case "contact_support":
        window.open("mailto:support@iv-relife.com?subject=Account Setup Issue", "_blank")
        break
      case "contact_admin":
        window.open("mailto:admin@iv-relife.com?subject=Invitation Issue", "_blank")
        break
      case "check_connection":
        startTransition(async () => {
          try {
            await fetch("/api/health")
            clearError()
          } catch {
            handleError("Connection test failed. Please check your internet connection.", { type: "authentication" })
          }
        })
        break
    }
  }

  const handlePasswordSubmit = (password: string, confirmPassword: string) => {
    if (!password || !confirmPassword) {
      handleError("Please fill in both password fields", { type: "validation" })
      return
    }

    if (password.length < 8) {
      handleError("Password must be at least 8 characters long", { type: "validation" })
      return
    }

    if (password !== confirmPassword) {
      handleError("Passwords do not match", { type: "validation" })
      return
    }

    startTransition(async () => {
      try {
        const supabase = createClient()

        if (isInvitationFlow && invitationToken && userEmail) {
          const response = await fetch("/api/complete-invitation-signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: invitationToken,
              email: userEmail,
              password: password,
            }),
          })

          const result = await response.json()

          if (!response.ok) {
            handleError(`${result.error}${result.details ? ` - ${result.details}` : ""}`, { type: "invitation" })
            return
          }

          router.push(
            "/auth/login?message=Account setup completed successfully! Please sign in with your new password.",
          )
          return
        }

        let updateError
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session && isPasswordReset) {
          const urlSearchParams = new URLSearchParams(window.location.search)
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = urlSearchParams.get("access_token") || hashParams.get("access_token")

          if (accessToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: "",
            })

            if (sessionError) {
              const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                  apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                },
                body: JSON.stringify({ password }),
              })

              if (!response.ok) {
                const errorData = await response.json()
                updateError = new Error(errorData.message || "Failed to update password")
              } else {
                await supabase.auth.refreshSession()
              }
            } else {
              const response = await supabase.auth.updateUser({ password })
              updateError = response.error
            }
          } else {
            updateError = new Error("No access token available for password reset")
          }
        } else {
          const response = await supabase.auth.updateUser({ password })
          updateError = response.error
        }

        if (updateError) {
          handleError(updateError.message, { type: "password_reset" })
          return
        }

        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from("user_profiles")
            .update({
              email_verified_at: new Date().toISOString(),
              last_login_at: new Date().toISOString(),
            })
            .eq("user_id", user.id)

          if (!isPasswordReset) {
            await supabase
              .from("user_invitations")
              .update({
                status: "accepted",
                accepted_at: new Date().toISOString(),
              })
              .eq("email", user.email)
          }
        }

        router.push("/dashboard")
      } catch (error) {
        handleError("An unexpected error occurred", { type: "authentication" })
      }
    })
  }

  if (!isInitialized) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Initializing...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLinkExpired) {
    return <ExpiredLinkCard userEmail={userEmail} onError={handleError} />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isInvitationFlow ? "Set Your Password" : isPasswordReset ? "Reset Your Password" : "Set Your Password"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ErrorDisplay error={error || ""} recoveryActions={recoveryActions} onRecoveryAction={handleRecoveryAction} />

        <PasswordForm
          userEmail={userEmail}
          isInvitationFlow={isInvitationFlow}
          isPasswordReset={isPasswordReset}
          isPending={isPending}
          onSubmit={handlePasswordSubmit}
        />
      </CardContent>
    </Card>
  )
}
