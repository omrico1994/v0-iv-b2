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
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      trackFailedLoginSimple(email).catch(console.error)
      redirect("/auth/login?error=Invalid email or password")
    }

    if (authData.user) {
      updateUserProfileAfterLogin(authData.user.id).catch((error) => {
        console.error("Profile update error:", error)
      })
    }

    redirect("/dashboard")
  } catch (error) {
    console.error("Sign in authentication error:", error)
    redirect("/auth/login?error=Authentication failed. Please try again.")
  }
}

async function updateUserProfileAfterLogin(userId: string) {
  const supabase = createClient()

  try {
    await supabase
      .from("user_profiles")
      .update({
        last_login_at: new Date().toISOString(),
        failed_login_attempts: 0,
        locked_until: null,
      })
      .eq("id", userId)
  } catch (error) {
    console.error("Profile update error:", error)
  }
}

async function trackFailedLoginSimple(email: string) {
  const supabase = createClient()

  try {
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

      if (currentAttempts >= maxAttempts) {
        const lockDuration = 30 * 60 * 1000 // 30 minutes
        updateData.locked_until = new Date(Date.now() + lockDuration).toISOString()
      }

      await supabase.from("user_profiles").update(updateData).eq("id", profile.id)
    }
  } catch (error) {
    console.error("Error tracking failed login:", error)
  }
}

export async function signUp(prevState: any, formData: FormData) {
  redirect("/auth/login")
}

export async function signOut() {
  const supabase = createClient()

  await supabase.auth.signOut()
  redirect("/auth/login")
}
