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
    console.log("[v0] Starting account lock check...")

    // First, get user by email to check if account is locked
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.log("[v0] Error listing users:", listError)
    }

    const existingUser = authUsers?.users.find((u) => u.email === email)
    console.log("[v0] Found existing user:", !!existingUser)

    if (existingUser) {
      console.log("[v0] Checking user profile for locks...")
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("failed_login_attempts, locked_until")
        .eq("id", existingUser.id)
        .single()

      if (profileError) {
        console.log("[v0] Profile query error:", profileError)
      }

      // Check if account is locked
      if (profile?.locked_until && new Date(profile.locked_until) > new Date()) {
        console.log("[v0] Account is locked until:", profile.locked_until)
        const lockExpiry = new Date(profile.locked_until).toLocaleString()
        redirect(`/auth/login?error=Account is locked until ${lockExpiry}`)
      }
    }

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

    if (authData.user) {
      // Update profile in background - don't let errors here affect successful login
      try {
        console.log("[v0] Updating user profile after successful login...")
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({
            last_login_at: new Date().toISOString(),
            failed_login_attempts: 0, // Reset failed attempts on successful login
            locked_until: null, // Clear any existing lock
          })
          .eq("id", authData.user.id)

        if (updateError) {
          console.log("[v0] Profile update error (non-blocking):", updateError)
        }

        console.log("[v0] Checking email verification status...")
        const { data: userProfile, error: verifyError } = await supabase
          .from("user_profiles")
          .select("email_verified_at")
          .eq("id", authData.user.id)
          .single()

        if (verifyError) {
          console.log("[v0] Email verification check error (non-blocking):", verifyError)
        }

        if (!userProfile?.email_verified_at) {
          console.log("[v0] Email not verified, redirecting to verification page")
          redirect("/auth/verify-email?message=Please verify your email before continuing")
        }
      } catch (profileError) {
        // Profile errors shouldn't prevent successful login
        console.log("[v0] Profile update error (non-blocking):", profileError)
      }
    }

    console.log("[v0] Authentication complete, redirecting to dashboard")
    redirect("/dashboard")
  } catch (error) {
    // Only catch errors that happen before successful authentication
    console.error("[v0] Sign in authentication error:", error)
    redirect("/auth/login?error=Authentication failed. Please try again.")
  }
}

async function trackFailedLogin(email: string) {
  const supabase = createClient()

  try {
    console.log("[v0] Tracking failed login for email:", email)

    // Get user by email from auth
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.log("[v0] Error listing users:", listError)
    }

    const user = authUsers?.users.find((u) => u.email === email)
    console.log("[v0] Found user:", !!user)

    if (!user) return // User doesn't exist, don't track

    // Get current failed attempts
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("failed_login_attempts")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.log("[v0] Profile query error:", profileError)
    }

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
    const { error: updateError } = await supabase.from("user_profiles").update(updateData).eq("id", user.id)

    if (updateError) {
      console.log("[v0] Failed login update error:", updateError)
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
