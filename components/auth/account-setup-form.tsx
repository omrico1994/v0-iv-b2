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
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const extractTokensFromUrl = () => {
      console.log("[v0] === COMPREHENSIVE URL DEBUG ===")
      console.log("[v0] Full URL:", window.location.href)
      console.log("[v0] Pathname:", window.location.pathname)
      console.log("[v0] Search params:", window.location.search)
      console.log("[v0] Hash:", window.location.hash)
      console.log("[v0] Host:", window.location.host)

      const urlSearchParams = new URLSearchParams(window.location.search)
      console.log("[v0] All search params:")
      for (const [key, value] of urlSearchParams.entries()) {
        console.log(`[v0]   ${key}: ${value}`)
      }

      const hash = window.location.hash.substring(1)
      const hashParams = new URLSearchParams(hash)
      console.log("[v0] All hash params:")
      for (const [key, value] of hashParams.entries()) {
        console.log(`[v0]   ${key}: ${value}`)
      }

      const errorCode = urlSearchParams.get("error_code") || hashParams.get("error_code")
      const errorDescription = urlSearchParams.get("error_description") || hashParams.get("error_description")

      if (errorCode === "otp_expired" || errorDescription?.includes("expired")) {
        console.log("[v0] Detected expired reset link")
        setIsLinkExpired(true)
        setError("This reset link has expired. Please request a new one.")
        return { type: null, accessToken: null, refreshToken: null }
      }

      let type = searchParams.get("type")
      let accessToken = searchParams.get("access_token")
      let refreshToken = searchParams.get("refresh_token")

      console.log(
        "[v0] From search params - type:",
        type,
        "access_token:",
        !!accessToken,
        "refresh_token:",
        !!refreshToken,
      )

      if (!accessToken || !refreshToken) {
        type = type || hashParams.get("type")
        accessToken = accessToken || hashParams.get("access_token")
        refreshToken = refreshToken || hashParams.get("refresh_token")

        console.log("[v0] From hash - type:", type, "access_token:", !!accessToken, "refresh_token:", !!refreshToken)

        if (!accessToken) {
          accessToken =
            hashParams.get("token") ||
            hashParams.get("access-token") ||
            hashParams.get("accessToken") ||
            hashParams.get("auth_token") ||
            hashParams.get("authToken")
        }
        if (!refreshToken) {
          refreshToken =
            hashParams.get("refresh-token") ||
            hashParams.get("refreshToken") ||
            hashParams.get("refresh_token") ||
            hashParams.get("rt")
        }

        console.log("[v0] After alternative names - access_token:", !!accessToken, "refresh_token:", !!refreshToken)
      }

      return { type, accessToken, refreshToken }
    }

    const { type, accessToken, refreshToken } = extractTokensFromUrl()

    if (isLinkExpired) {
      return
    }

    console.log("[v0] Setup form params:", { type, hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken })

    const supabase = createClient()

    if (type === "recovery" && accessToken) {
      console.log("[v0] Handling password reset flow - token will be validated during password update")
      setIsPasswordReset(true)
      setError(null)
      // Don't try to validate the recovery token here, it will be used directly in updateUser
    } else if ((type === "signup" || type === "invite") && accessToken && refreshToken) {
      // Handle invitation flows that have both tokens
      setIsPasswordReset(false)
      supabase.auth
        .setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        .then(({ error }) => {
          if (error) {
            console.log("[v0] Session set error:", error)
            setError("Failed to authenticate. Please try clicking the invitation link again.")
          } else {
            console.log("[v0] Session set successfully for invitation")
            setError(null)
          }
        })
        .catch((err) => {
          console.log("[v0] Session set catch error:", err)
          setError("Failed to authenticate. Please try again.")
        })
    } else {
      // Check for existing session
      supabase.auth
        .getSession()
        .then(({ data: { session }, error }) => {
          if (session && session.user) {
            console.log("[v0] Found existing session for user:", session.user.email)
            setIsPasswordReset(true)
            setUserEmail(session.user.email)
            setError(null)
          } else {
            console.log("[v0] No valid tokens found and no existing session")
            setError("Auth session missing!")
          }
        })
        .catch((err) => {
          console.log("[v0] Get session error:", err)
          setError("Failed to check authentication status.")
        })
    }
  }, [searchParams, isLinkExpired])

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

        console.log("[v0] Attempting password update, isPasswordReset:", isPasswordReset)

        let updateError
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session && isPasswordReset) {
          // Extract token again for password update
          const urlSearchParams = new URLSearchParams(window.location.search)
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = urlSearchParams.get("access_token") || hashParams.get("access_token")

          if (accessToken) {
            console.log("[v0] Using recovery token for password update")
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: "", // Recovery tokens don't need refresh token
            })

            if (sessionError) {
              console.log("[v0] Session set error with recovery token:", sessionError)
              // Try direct password update with recovery token
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
                // Refresh the session after password update
                await supabase.auth.refreshSession()
              }
            } else {
              // Session set successfully, now update password normally
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
        setError("An unexpected error occurred")
      }
    })
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
        <CardTitle>{isPasswordReset ? "Reset Your Password" : "Set Your Password"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert className="border-destructive bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
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
            {isPasswordReset ? "Update Password" : "Complete Setup"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
