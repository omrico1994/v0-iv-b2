"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    redirect("/auth/login?error=Email and password are required")
  }

  const supabase = createClient()

  try {
    // First, get user by email to check if account is locked
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
        const lockExpiry = new Date(profile.locked_until).toLocaleString()
        redirect(`/auth/login?error=Account is locked until ${lockExpiry}`)
      }
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      await trackFailedLogin(email)
      redirect("/auth/login?error=Invalid email or password")
    }

    if (authData.user) {
      await supabase
        .from("user_profiles")
        .update({
          last_login_at: new Date().toISOString(),
          failed_login_attempts: 0, // Reset failed attempts on successful login
          locked_until: null, // Clear any existing lock
        })
        .eq("id", authData.user.id)

      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("email_verified_at")
        .eq("id", authData.user.id)
        .single()

      if (!userProfile?.email_verified_at) {
        redirect("/auth/verify-email?message=Please verify your email before continuing")
      }
    }
  } catch (error) {
    console.error("Sign in error:", error)
    redirect("/auth/login?error=Authentication failed. Please try again.")
  }

  redirect("/dashboard")
}

async function trackFailedLogin(email: string) {
  const supabase = createClient()

  try {
    // Get user by email from auth
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const user = authUsers?.users.find((u) => u.email === email)

    if (!user) return // User doesn't exist, don't track

    // Get current failed attempts
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

    await supabase.from("user_profiles").update(updateData).eq("id", user.id)
  } catch (error) {
    console.error("Error tracking failed login:", error)
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
