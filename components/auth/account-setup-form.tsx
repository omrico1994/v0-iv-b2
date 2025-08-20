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
    const type = searchParams.get("type")
    const accessToken = searchParams.get("access_token")
    const refreshToken = searchParams.get("refresh_token")

    console.log("[v0] Setup form params:", { type, hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken })

    if (type === "recovery" && accessToken && refreshToken) {
      setIsPasswordReset(true)
      // Set the session from URL parameters
      const supabase = createClient()
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
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
          // For password reset flow, update the password
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
          // For invitation flow, update the password
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

          // Update invitation status if this was from an invitation
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

        // Redirect to dashboard
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
