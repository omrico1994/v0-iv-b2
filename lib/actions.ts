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

    // Check account lock status first
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const existingUser = authUsers?.users.find((u) => u.email === email)

    if (existingUser) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("failed_login_attempts, locked_until")
        .eq("id", existingUser.id)
        .single()

      // Check if account is locked
      if (profile?.locked_until && new Date(profile.locked_until) > new Date()) {
        console.log("[v0] Account is locked until:", profile.locked_until)
        const lockExpiry = new Date(profile.locked_until).toLocaleString()
        redirect(`/auth/login?error=Account is locked until ${lockExpiry}`)
      }
    }

    // Attempt authentication
    console.log("[v0] Attempting sign in with password...")
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.log("[v0] Sign in error:", error)
      await trackFailedLogin(email)
      redirect("/auth/login?error=Invalid email or password")
    }

    console.log("[v0] Sign in successful, user ID:", authData.user?.id)

    // Authentication succeeded - redirect to dashboard immediately
    // Handle profile updates in background without blocking redirect
    if (authData.user) {
      // Fire and forget profile updates - don't await or catch errors
      updateUserProfileAfterLogin(authData.user.id, authData.user.email).catch((error) => {
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

async function updateUserProfileAfterLogin(userId: string, email: string | undefined) {
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

    // Check email verification - redirect if needed
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("email_verified_at")
      .eq("id", userId)
      .single()

    if (!userProfile?.email_verified_at) {
      console.log("[v0] Email not verified - user will be prompted on dashboard")
      // Don't redirect here - let the dashboard handle email verification prompts
    }
  } catch (error) {
    console.log("[v0] Profile update error (non-blocking):", error)
  }
}

async function trackFailedLogin(email: string) {
  const supabase = createClient()

  try {
    console.log("[v0] Tracking failed login for email:", email)

    // Get user by email from auth
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const user = authUsers?.users.find((u) => u.email === email)

    if (user) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("failed_login_attempts")
        .eq("id", user.id)
        .single()

      const currentAttempts = (profile?.failed_login_attempts || 0) + 1
      const maxAttempts = 5 // Lock after 5 failed attempts

      const updateData: any = {
        failed_login_attempts: currentAttempts,
      }

      // Lock account if max attempts reached
      if (currentAttempts >= maxAttempts) {
        const lockDuration = 30 * 60 * 1000 // 30 minutes
        updateData.locked_until = new Date(Date.now() + lockDuration).toISOString()
      }

      console.log("[v0] Updating failed login attempts...")
      await supabase.from("user_profiles").update(updateData).eq("id", user.id)
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
