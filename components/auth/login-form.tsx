"use client"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function LoginFormContent() {
  const searchParams = useSearchParams()
  const urlError = searchParams.get("error")
  const router = useRouter()

  const [error, setError] = useState<string | null>(urlError)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    console.log("[v0] Login form submitted at:", new Date().toISOString())

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    console.log("[v0] Email:", email)
    console.log("[v0] Starting client-side authentication...")

    if (!email || !password) {
      setError("Email and password are required")
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      console.log("[v0] Attempting sign in with password...")
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        console.log("[v0] Sign in error:", authError.message)
        setError("Invalid email or password")
        setIsLoading(false)
        return
      }

      console.log("[v0] Sign in successful, user ID:", authData.user?.id)
      console.log("[v0] Redirecting to dashboard...")

      router.push("/dashboard")
    } catch (error) {
      console.error("[v0] Authentication error:", error)
      setError("Authentication failed. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required className="w-full" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required className="w-full" />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  )
}

export function LoginForm() {
  return (
    <Suspense
      fallback={
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required className="w-full" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required className="w-full" />
          </div>
          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
      }
    >
      <LoginFormContent />
    </Suspense>
  )
}
