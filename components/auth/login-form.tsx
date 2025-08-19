"use client"
import { useFormState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEffect } from "react"

const initialState = {
  error: null,
  success: false,
}

export function LoginForm() {
  const [state, formAction] = useFormState(signIn, initialState)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) {
      router.push("/dashboard")
      router.refresh()
    }
  }, [state?.success, router])

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
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
