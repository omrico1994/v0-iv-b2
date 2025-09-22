"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Mail, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ExpiredLinkCardProps {
  userEmail?: string | null
  onError: (error: string) => void
}

export function ExpiredLinkCard({ userEmail, onError }: ExpiredLinkCardProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

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
        setError("Failed to send new reset link. Please try again.")
      }
    })
  }

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
