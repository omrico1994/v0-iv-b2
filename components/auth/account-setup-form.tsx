"use client"

import type React from "react"

import { useState, useTransition, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Mail } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"

export function AccountSetupForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isPasswordReset, setIsPasswordReset] = useState(false)
  const [isLinkExpired, setIsLinkExpired] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [invitationToken, setInvitationToken] = useState<string | null>(null)
  const [isInvitationFlow, setIsInvitationFlow] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

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
            setError("This reset link has expired. Please request a new one.")
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
                setError("Invalid or expired invitation link. Please request a new invitation.")
                setIsInitialized(true)
                return
              }

              console.log("[v0] Valid invitation token found")
              setError(null)
              setIsInitialized(true)
              return
            } catch (validationError) {
              console.log("[v0] Invitation validation error:", validationError)
              setError("Failed to validate invitation. Please try again.")
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
          } else if ((type === "signup" || type === "invite") && accessToken && refreshToken) {
            setIsPasswordReset(false)
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (sessionError) {
              console.log("[v0] Session set error:", sessionError)
              setError("Failed to authenticate. Please try clicking the invitation link again.")
            } else {
              console.log("[v0] Session set successfully for invitation")
              setError(null)
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
            } else {
              console.log("[v0] No valid tokens found and no existing session")
              setError("Auth session missing!")
            }
          }
        } catch (err) {
          console.log("[v0] Auth initialization error:", err)
          setError("Failed to initialize authentication.")
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
          setError("Email address is required to send a new reset link.")
          return
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/setup-account`,
        })

        if (error) {
          setError(`Failed to send reset email: ${error.message}`)
        } else {
          setError(null)
          alert("A new password reset link has been sent to your email.")
        }
      } catch (error) {
        console.log("[v0] Request new link error:", error)
        setError("Failed to send new reset link. Please try again.")
      }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    startTransition(async () => {
      try {
        const supabase = createClient()

        if (isInvitationFlow && invitationToken && userEmail) {
          console.log("[v0] Processing invitation signup")
          console.log("[v0] Making API call to /api/complete-invitation-signup with:", {
            token: invitationToken,
            email: userEmail,
            passwordLength: password.length,
          })

          let response
          let result

          try {
            response = await fetch("/api/complete-invitation-signup", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                token: invitationToken,
                email: userEmail,
                password: password,
              }),
            })

            console.log("[v0] API response status:", response.status)
            console.log("[v0] API response ok:", response.ok)

            result = await response.json()
            console.log("[v0] API response body:", result)
          } catch (fetchError) {
            console.log("[v0] Fetch error:", fetchError)
            setError("Network error: Failed to connect to server")
            return
          }

          if (!response.ok) {
            console.log("[v0] Invitation signup error:", result.error)
            setError(result.error || "Failed to complete account setup")
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
          setError(updateError.message)
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
        setError("An unexpected error occurred")
      }
    })
  }

  const handleTestAccountCreation = () => {
    if (!userEmail || !password) {
      setError("Email and password are required for testing")
      return
    }

    startTransition(async () => {
      try {
        console.log("[v0] Testing account creation bypass...")

        const response = await fetch("/api/test-account-creation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userEmail,
            password: password,
          }),
        })

        const result = await response.json()
        console.log("[v0] Test API response:", result)

        if (!response.ok) {
          setError(`Test failed: ${result.error}`)
          return
        }

        setError(null)
        alert(`Test successful! User created with ID: ${result.userId}`)
      } catch (error) {
        console.log("[v0] Test error:", error)
        setError("Test failed: Network error")
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
            <Alert className="border-destructive bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
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
            />
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
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending || !password || !confirmPassword}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isInvitationFlow ? "Complete Setup" : isPasswordReset ? "Update Password" : "Complete Setup"}
          </Button>

          {isInvitationFlow && userEmail && (
            <Button
              type="button"
              variant="outline"
              className="w-full bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              onClick={handleTestAccountCreation}
              disabled={isPending || !password || !confirmPassword}
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Test Account Creation (Debug)
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
