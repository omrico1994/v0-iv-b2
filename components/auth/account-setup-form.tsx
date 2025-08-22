"use client"

import type React from "react"

import { useState, useTransition, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Mail, RefreshCw, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { ErrorMessageHandler, type ErrorContext } from "@/lib/utils/error-messages"

interface RecoveryAction {
  label: string
  action: string
  primary?: boolean
}

export function AccountSetupForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [errorContext, setErrorContext] = useState<ErrorContext | undefined>()
  const [recoveryActions, setRecoveryActions] = useState<RecoveryAction[]>([])
  const [isPasswordReset, setIsPasswordReset] = useState(false)
  const [isLinkExpired, setIsLinkExpired] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [invitationToken, setInvitationToken] = useState<string | null>(null)
  const [isInvitationFlow, setIsInvitationFlow] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleError = (errorMessage: string | Error, context?: ErrorContext) => {
    const friendlyMessage = ErrorMessageHandler.getErrorMessage(errorMessage, context)
    const actions = ErrorMessageHandler.getRecoveryActions(errorMessage, context)

    setError(friendlyMessage)
    setErrorContext(context)
    setRecoveryActions(actions)
  }

  const handleRecoveryAction = (action: string) => {
    switch (action) {
      case "request_invitation":
        // Redirect to request invitation page or show contact info
        router.push("/auth/request-invitation")
        break
      case "sign_in":
        router.push("/auth/login")
        break
      case "reset_password":
        router.push("/auth/reset-password")
        break
      case "retry":
        setError(null)
        setRecoveryActions([])
        // Retry the last action
        break
      case "contact_support":
        window.open("mailto:support@iv-relife.com?subject=Account Setup Issue", "_blank")
        break
      case "contact_admin":
        window.open("mailto:admin@iv-relife.com?subject=Invitation Issue", "_blank")
        break
      case "check_connection":
        // Simple connectivity check
        fetch("/api/health")
          .then(() => {
            setError(null)
            setRecoveryActions([])
          })
          .catch(() => {
            handleError("Connection test failed. Please check your internet connection.", { type: "authentication" })
          })
        break
    }
  }

  useEffect(() => {
    startTransition(() => {
      const initializeAuth = async () => {
        try {
          console.log("[v0] === COMPREHENSIVE URL DEBUG ===")
          console.log("[v0] Full URL:", window.location.href)
          console.log("[v0] Hash:", window.location.hash)
          console.log("[v0] Host:", window.location.host)

          const urlSearchParams = new URLSearchParams(window.location.search)
          const hash = window.location.hash.substring(1)
          const hashParams = new URLSearchParams(hash)

          const errorCode = urlSearchParams.get("error_code") || hashParams.get("error_code")
          const errorDescription = urlSearchParams.get("error_description") || hashParams.get("error_description")

          if (errorCode === "otp_expired" || errorDescription?.includes("expired")) {
            console.log("[v0] Detected expired reset link")
            setIsLinkExpired(true)
            handleError("This reset link has expired. Please request a new one.", { type: "password_reset" })
            setIsInitialized(true)
            return
          }

          const customToken = searchParams.get("token")
          const email = searchParams.get("email")

          if (customToken && email) {
            console.log("[v0] Found custom invitation token, validating...")
            console.log("[v0] Query params:", { customToken, email })
            setIsInvitationFlow(true)
            setInvitationToken(customToken)
            setUserEmail(email)

            try {
              const response = await fetch("/api/validate-invitation", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  token: customToken,
                  email: email,
                }),
              })

              const result = await response.json()
              console.log("[v0] Invitation validation result:", result)

              if (!response.ok || !result.valid) {
                console.log("[v0] Invalid or expired invitation token:", result.error)
                handleError(result.error || "Invalid or expired invitation", { type: "invitation" })
                setIsInitialized(true)
                return
              }

              console.log("[v0] Valid invitation token found")
              setError(null)
              setRecoveryActions([])
              setIsInitialized(true)
              return
            } catch (validationError) {
              console.log("[v0] Invitation validation error:", validationError)
              handleError("Failed to validate invitation. Please try again.", { type: "invitation" })
              setIsInitialized(true)
              return
            }
          }

          let type = searchParams.get("type")
          let accessToken = searchParams.get("access_token")
          let refreshToken = searchParams.get("refresh_token")

          if (!accessToken || !refreshToken) {
            type = type || hashParams.get("type")
            accessToken = accessToken || hashParams.get("access_token")
            refreshToken = refreshToken || hashParams.get("refresh_token")
          }

          console.log("[v0] Setup form params:", {
            type,
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
          })

          const supabase = createClient()

          if (type === "recovery" && accessToken) {
            console.log("[v0] Handling password reset flow")
            setIsPasswordReset(true)
            setError(null)
            setRecoveryActions([])
          } else if ((type === "signup" || type === "invite") && accessToken && refreshToken) {
            setIsPasswordReset(false)
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (sessionError) {
              console.log("[v0] Session set error:", sessionError)
              handleError("Failed to authenticate. Please try clicking the invitation link again.", {
                type: "authentication",
              })
            } else {
              console.log("[v0] Session set successfully for invitation")
              setError(null)
              setRecoveryActions([])
            }
          } else {
            const {
              data: { session },
              error: sessionError,
            } = await supabase.auth.getSession()

            if (session && session.user) {
              console.log("[v0] Found existing session for user:", session.user.email)
              setIsPasswordReset(true)
              setUserEmail(session.user.email)
              setError(null)
              setRecoveryActions([])
            } else {
              console.log("[v0] No valid tokens found and no existing session")
              handleError("Authentication session is missing. Please use the link from your email.", {
                type: "authentication",
              })
            }
          }
        } catch (err) {
          console.log("[v0] Auth initialization error:", err)
          handleError("Failed to initialize authentication.", { type: "authentication" })
        } finally {
          setIsInitialized(true)
        }
      }

      initializeAuth()
    })
  }, [searchParams])

  const handleRequestNewLink = () => {
    startTransition(async () => {
      try {
        const supabase = createClient()
        const email = userEmail || prompt("Please enter your email address:")

        if (!email) {
          handleError("Email address is required to send a new reset link.", { type: "validation" })
          return
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/setup-account`,
        })

        if (error) {
          handleError(`Failed to send reset email: ${error.message}`, { type: "password_reset" })
        } else {
          setError(null)
          setRecoveryActions([])
          alert("A new password reset link has been sent to your email.")
        }
      } catch (error) {
        console.log("[v0] Request new link error:", error)
        handleError("Failed to send new reset link. Please try again.", { type: "password_reset" })
      }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    console.log("[v0] Form validation check:", {
      passwordLength: password.length,
      confirmPasswordLength: confirmPassword.length,
      passwordsMatch: password === confirmPassword,
      hasPassword: !!password,
      hasConfirmPassword: !!confirmPassword,
    })

    if (!password || !confirmPassword) {
      handleError("Please fill in both password fields", { type: "validation" })
      return
    }

    if (password.length < 8) {
      handleError("Password must be at least 8 characters long", { type: "validation" })
      return
    }

    if (confirmPassword.length < 8) {
      handleError("Confirm password must be at least 8 characters long", { type: "validation" })
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
          console.log("[v0] Processing invitation signup")

          const requestData = {
            token: invitationToken,
            email: userEmail,
            password: password,
          }

          console.log("[v0] Making API call to /api/complete-invitation-signup with:", {
            token: invitationToken,
            email: userEmail,
            passwordLength: password.length,
            hasPassword: !!password,
            passwordFirstChar: password.charAt(0),
            passwordLastChar: password.charAt(password.length - 1),
          })

          let response
          let result

          try {
            response = await fetch("/api/complete-invitation-signup", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestData),
            })

            console.log("[v0] API response status:", response.status)
            console.log("[v0] API response ok:", response.ok)

            result = await response.json()
            console.log("[v0] API response body:", result)
          } catch (fetchError) {
            console.log("[v0] Fetch error:", fetchError)
            handleError("Network error: Failed to connect to server", { type: "invitation" })
            return
          }

          if (!response.ok) {
            console.log("[v0] Invitation signup error:", result.error)
            handleError(result.error || "Failed to complete account setup", { type: "invitation" })
            return
          }

          console.log("[v0] Invitation signup successful, signing in user...")

          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: userEmail,
            password: password,
          })

          if (signInError) {
            console.log("[v0] Auto sign-in error:", signInError)
            router.push("/auth/login?message=Account created successfully. Please sign in.")
            return
          }

          console.log("[v0] User signed in successfully, redirecting to:", result.redirectUrl)
          router.push(result.redirectUrl || "/dashboard")
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
            console.log("[v0] Using recovery token for password update")
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: "",
            })

            if (sessionError) {
              console.log("[v0] Session set error with recovery token:", sessionError)
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
                console.log("[v0] Password reset successful via direct API call")
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
          console.log("[v0] Password update error:", updateError)
          handleError(updateError.message, { type: "password_reset" })
          return
        }

        console.log("[v0] Password update successful")

        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { error: profileError } = await supabase
            .from("user_profiles")
            .update({
              email_verified_at: new Date().toISOString(),
              last_login_at: new Date().toISOString(),
            })
            .eq("user_id", user.id)

          if (profileError) {
            console.log("[v0] Profile update error:", profileError)
          }

          if (!isPasswordReset) {
            const { error: invitationError } = await supabase
              .from("user_invitations")
              .update({
                status: "accepted",
                accepted_at: new Date().toISOString(),
              })
              .eq("email", user.email)

            if (invitationError) {
              console.log("[v0] Invitation update error:", invitationError)
            }
          }
        }

        router.push("/dashboard")
      } catch (error) {
        console.log("[v0] Setup error:", error)
        console.log("[v0] Error details:", {
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : "No stack trace",
          isInvitationFlow,
          hasToken: !!invitationToken,
          hasEmail: !!userEmail,
        })
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
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Reset Link Expired
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This password reset link has expired. Password reset links are only valid for a limited time for security
              reasons.
            </AlertDescription>
          </Alert>

          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">To reset your password, please request a new reset link.</p>

            <Button onClick={handleRequestNewLink} disabled={isPending} className="w-full">
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send New Reset Link
            </Button>

            {error && (
              <Alert className="border-destructive bg-destructive/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-destructive">{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isInvitationFlow ? "Set Your Password" : isPasswordReset ? "Reset Your Password" : "Set Your Password"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="space-y-3">
              <Alert className="border-destructive bg-destructive/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-destructive">{error}</AlertDescription>
              </Alert>

              {recoveryActions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {recoveryActions.map((action, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant={action.primary ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleRecoveryAction(action.action)}
                      className="text-xs"
                    >
                      {action.action === "retry" && <RefreshCw className="w-3 h-3 mr-1" />}
                      {(action.action === "contact_support" || action.action === "contact_admin") && (
                        <ExternalLink className="w-3 h-3 mr-1" />
                      )}
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {isInvitationFlow && userEmail && (
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={userEmail} disabled className="bg-muted" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">{isPasswordReset ? "New Password" : "Password"}</Label>
            <Input
              id="password"
              type="password"
              placeholder={isPasswordReset ? "Enter your new password" : "Enter your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              noValidate
            />
            {password && password.length < 8 && (
              <p className="text-sm text-muted-foreground">
                Password must be at least 8 characters ({password.length}/8)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              noValidate
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-sm text-destructive">Passwords do not match</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPending || !password || !confirmPassword}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isInvitationFlow ? "Complete Setup" : isPasswordReset ? "Update Password" : "Complete Setup"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
