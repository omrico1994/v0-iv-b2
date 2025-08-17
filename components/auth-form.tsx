"use client"

import { useState, useEffect } from "react"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, Shield } from "lucide-react"
import { signIn, signUp } from "@/lib/actions"
import { PasswordStrength } from "@/components/security/password-strength"
import { TwoFactorSetup } from "@/components/security/two-factor-setup"
import Link from "next/link"

function SubmitButton({ isLogin, loading }: { isLogin: boolean; loading: boolean }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full" disabled={loading || pending}>
      {loading || pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isLogin ? "Signing in..." : "Creating account..."}
        </>
      ) : isLogin ? (
        "Sign In"
      ) : (
        "Create Account"
      )}
    </Button>
  )
}

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [isPasswordValid, setIsPasswordValid] = useState(false)
  const [show2FA, setShow2FA] = useState(false)
  const [clientIP, setClientIP] = useState("")

  const [signInState, signInAction] = useActionState(signIn, null)
  const [signUpState, signUpAction] = useActionState(signUp, null)

  // Get client IP for rate limiting
  useEffect(() => {
    fetch("/api/get-ip")
      .then((res) => res.json())
      .then((data) => setClientIP(data.ip))
      .catch(() => setClientIP("unknown"))
  }, [])

  useEffect(() => {
    if (signInState?.success) {
      window.location.href = "/dashboard"
    }
  }, [signInState])

  const handleSubmit = (formData: FormData) => {
    // Add client IP to form data for rate limiting
    formData.append("clientIP", clientIP)

    if (isLogin) {
      signInAction(formData)
    } else {
      signUpAction(formData)
    }
  }

  const handle2FASetup = (secret: string, code: string) => {
    // In production, verify the TOTP code server-side
    console.log("2FA setup:", { secret, code })
    setShow2FA(false)
  }

  if (show2FA) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <TwoFactorSetup onComplete={handle2FASetup} onCancel={() => setShow2FA(false)} />
      </div>
    )
  }

  const currentState = isLogin ? signInState : signUpState

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{isLogin ? "Welcome back" : "Create account"}</CardTitle>
          <CardDescription>
            {isLogin ? "Sign in to your account" : "Enter your details to create your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            {currentState?.error && (
              <Alert variant="destructive">
                <AlertDescription>{currentState.error}</AlertDescription>
              </Alert>
            )}

            {currentState?.success && (
              <Alert>
                <AlertDescription>{currentState.success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required autoComplete="email" />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" name="fullName" type="text" placeholder="John Doe" autoComplete="name" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {!isLogin && password && <PasswordStrength password={password} onValidityChange={setIsPasswordValid} />}

            <SubmitButton isLogin={isLogin} loading={false} />
          </form>

          <div className="mt-4 space-y-4">
            {isLogin && (
              <div className="text-center">
                <Link href="/auth/reset-password" className="text-sm text-blue-600 hover:underline">
                  Forgot your password?
                </Link>
              </div>
            )}

            <div className="text-center">
              <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="text-sm">
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </Button>
            </div>

            {isLogin && (
              <div className="text-center">
                <Button variant="outline" size="sm" onClick={() => setShow2FA(true)} className="text-sm">
                  <Shield className="mr-2 h-4 w-4" />
                  Setup 2FA
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
