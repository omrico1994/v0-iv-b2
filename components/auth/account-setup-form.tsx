"use client"

import type React from "react"

import { useState, useTransition, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"

export function AccountSetupForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isPasswordReset, setIsPasswordReset] = useState(false)
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

      const supabase = createClient()
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        console.log("[v0] Current Supabase session:", !!session, "error:", error)
        if (session) {
          console.log("[v0] Session user:", session.user?.email)
          console.log("[v0] Session expires at:", session.expires_at)
        }
      })

      return { type, accessToken, refreshToken }
    }

    const { type, accessToken, refreshToken } = extractTokensFromUrl()

    console.log("[v0] Setup form params:", { type, hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken })

    const supabase = createClient()

    if ((type === "recovery" || type === "signup" || accessToken) && accessToken && refreshToken) {
      setIsPasswordReset(type === "recovery")
      supabase.auth
        .setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        .then(({ error }) => {
          if (error) {
            console.log("[v0] Session set error:", error)
            setError("Failed to authenticate. Please try clicking the reset link again.")
          } else {
            console.log("[v0] Session set successfully for", type === "recovery" ? "password reset" : "invitation")
            setError(null)
          }
        })
    } else {
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (session && session.user) {
          console.log("[v0] Found existing session for user:", session.user.email)
          setIsPasswordReset(true)
          setError(null)
        } else {
          console.log("[v0] No valid tokens found and no existing session")
          setError("Auth session missing!")
        }
      })
    }
  }, [searchParams])

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

        if (isPasswordReset) {
          const { error: updateError } = await supabase.auth.updateUser({
            password: password,
          })

          if (updateError) {
            console.log("[v0] Password reset error:", updateError)
            setError(updateError.message)
            return
          }

          console.log("[v0] Password reset successful")
        } else {
          const { error: updateError } = await supabase.auth.updateUser({
            password: password,
          })

          if (updateError) {
            console.log("[v0] Invitation setup error:", updateError)
            setError(updateError.message)
            return
          }

          console.log("[v0] Invitation setup successful")
        }

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
