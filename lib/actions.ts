"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  console.log("[v0] SignIn attempt for email:", email)

  if (!email || !password) {
    console.log("[v0] Missing email or password")
    redirect("/auth/login?error=Email and password are required")
  }

  const supabase = createClient()

  try {
    console.log("[v0] Starting authentication process...")

    // Attempt authentication directly
    console.log("[v0] Attempting sign in with password...")
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.log("[v0] Sign in error:", error.message)
      trackFailedLoginSimple(email).catch(console.error)
      redirect("/auth/login?error=Invalid email or password")
    }

    console.log("[v0] Sign in successful, user ID:", authData.user?.id)

    if (authData.user) {
      updateUserProfileAfterLogin(authData.user.id).catch((error) => {
        console.log("[v0] Background profile update error (non-blocking):", error)
      })
    }

    console.log("[v0] Authentication complete, redirecting to dashboard")
    redirect("/dashboard")
  } catch (error) {
    console.error("[v0] Sign in authentication error:", error)
    redirect("/auth/login?error=Authentication failed. Please try again.")
  }
}

async function updateUserProfileAfterLogin(userId: string) {
  const supabase = createClient()

  try {
    console.log("[v0] Updating user profile after successful login...")

    // Update login tracking
    await supabase
      .from("user_profiles")
      .update({
        last_login_at: new Date().toISOString(),
        failed_login_attempts: 0,
        locked_until: null,
      })
      .eq("id", userId)

    console.log("[v0] Profile updated successfully")
  } catch (error) {
    console.log("[v0] Profile update error (non-blocking):", error)
  }
}

async function trackFailedLoginSimple(email: string) {
  const supabase = createClient()

  try {
    console.log("[v0] Tracking failed login for email:", email)

    // Update failed attempts for user profile by email
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("id, failed_login_attempts")
      .eq("email", email)
      .single()

    if (profile) {
      const currentAttempts = (profile.failed_login_attempts || 0) + 1
      const maxAttempts = 5

      const updateData: any = {
        failed_login_attempts: currentAttempts,
      }

      // Lock account if max attempts reached
      if (currentAttempts >= maxAttempts) {
        const lockDuration = 30 * 60 * 1000 // 30 minutes
        updateData.locked_until = new Date(Date.now() + lockDuration).toISOString()
      }

      await supabase.from("user_profiles").update(updateData).eq("id", profile.id)
    }
  } catch (error) {
    console.error("[v0] Error tracking failed login:", error)
  }
}

export async function signUp(prevState: any, formData: FormData) {
  // Redirect to login since signup is not allowed
  redirect("/auth/login")
}

export async function signOut() {
  const supabase = createClient()

  await supabase.auth.signOut()
  redirect("/auth/login")
}
