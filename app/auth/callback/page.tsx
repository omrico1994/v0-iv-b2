"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient()

      try {
        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Auth callback error:", error)
          setStatus("error")
          setMessage(error.message || "Authentication failed")
          return
        }

        if (data.session) {
          // Check if this is email verification
          const type = searchParams.get("type")

          if (type === "email") {
            setStatus("success")
            setMessage("Email verified successfully!")

            // Log the email verification
            await supabase.from("audit_logs").insert({
              user_id: data.session.user.id,
              action: "email_verified",
              metadata: { email: data.session.user.email },
            })

            // Update user profile verification status
            await supabase.from("user_profiles").update({ is_verified: true }).eq("id", data.session.user.id)

            // Redirect to dashboard after a short delay
            setTimeout(() => {
              router.push("/dashboard")
            }, 2000)
          } else {
            // Regular login callback
            router.push("/dashboard")
          }
        } else {
          setStatus("error")
          setMessage("No session found")
        }
      } catch (error) {
        console.error("Callback processing error:", error)
        setStatus("error")
        setMessage("An unexpected error occurred")
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-12 w-12 text-chart-2" />
      case "error":
        return <XCircle className="h-12 w-12 text-chart-4" />
      default:
        return <Loader2 className="h-12 w-12 text-primary animate-spin" />
    }
  }

  const getStatusTitle = () => {
    switch (status) {
      case "success":
        return "Verification Successful!"
      case "error":
        return "Verification Failed"
      default:
        return "Processing..."
    }
  }

  const getStatusDescription = () => {
    switch (status) {
      case "success":
        return "Your email has been verified. Redirecting to dashboard..."
      case "error":
        return message || "There was an error processing your request"
      default:
        return "Please wait while we verify your email address"
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">{getStatusIcon()}</div>
          <CardTitle>{getStatusTitle()}</CardTitle>
          <CardDescription>{getStatusDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "error" && (
            <>
              <Alert variant="destructive" className="mb-4">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Button onClick={() => router.push("/auth/login")} className="w-full">
                  Back to Login
                </Button>
                <Button variant="outline" onClick={() => router.push("/auth/signup")} className="w-full">
                  Create New Account
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
