"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Mail, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface EmailVerificationStatusProps {
  email?: string
  onResendVerification?: () => void
}

export function EmailVerificationStatus({ email, onResendVerification }: EmailVerificationStatusProps) {
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "verified" | "expired" | "error">("pending")
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    checkVerificationStatus()
  }, [])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const checkVerificationStatus = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user?.email_confirmed_at) {
      setVerificationStatus("verified")
    } else {
      setVerificationStatus("pending")
    }
  }

  const handleResendVerification = async () => {
    if (!email || resendCooldown > 0) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      })

      if (error) {
        setVerificationStatus("error")
      } else {
        setResendCooldown(60) // 60 second cooldown
        onResendVerification?.()
      }
    } catch (error) {
      setVerificationStatus("error")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case "verified":
        return <CheckCircle className="h-8 w-8 text-chart-2" />
      case "error":
      case "expired":
        return <XCircle className="h-8 w-8 text-chart-4" />
      default:
        return <Mail className="h-8 w-8 text-chart-3" />
    }
  }

  const getStatusMessage = () => {
    switch (verificationStatus) {
      case "verified":
        return {
          title: "Email Verified!",
          description: "Your email address has been successfully verified.",
          variant: "default" as const,
        }
      case "error":
        return {
          title: "Verification Error",
          description: "There was an error verifying your email. Please try again.",
          variant: "destructive" as const,
        }
      case "expired":
        return {
          title: "Verification Link Expired",
          description: "Your verification link has expired. Please request a new one.",
          variant: "destructive" as const,
        }
      default:
        return {
          title: "Check Your Email",
          description: "We've sent a verification link to your email address.",
          variant: "default" as const,
        }
    }
  }

  const status = getStatusMessage()

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">{getStatusIcon()}</div>
        <CardTitle>{status.title}</CardTitle>
        <CardDescription>{status.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {verificationStatus === "pending" && email && (
          <>
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Please check your email at <strong>{email}</strong> and click the verification link.
              </AlertDescription>
            </Alert>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Didn't receive the email?</p>
              <Button
                variant="outline"
                onClick={handleResendVerification}
                disabled={loading || resendCooldown > 0}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  "Resend Verification Email"
                )}
              </Button>
            </div>
          </>
        )}

        {(verificationStatus === "error" || verificationStatus === "expired") && email && (
          <Button onClick={handleResendVerification} disabled={loading || resendCooldown > 0} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : resendCooldown > 0 ? (
              `Resend in ${resendCooldown}s`
            ) : (
              "Send New Verification Email"
            )}
          </Button>
        )}

        {verificationStatus === "verified" && (
          <Button onClick={() => (window.location.href = "/dashboard")} className="w-full">
            Continue to Dashboard
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
