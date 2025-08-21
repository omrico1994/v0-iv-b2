"use client"
import { signIn } from "@/lib/actions"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function LoginFormContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    console.log("[v0] Login form submitted at:", new Date().toISOString())
    const formData = new FormData(event.currentTarget)
    console.log("[v0] Email:", formData.get("email"))
    console.log("[v0] Form action will call signIn server action")
  }

  return (
    <form action={signIn} onSubmit={handleSubmit} className="space-y-4">
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

      <Button type="submit" className="w-full">
        Sign In
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
