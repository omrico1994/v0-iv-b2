"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function signIn(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    // Check rate limiting
    const clientIP = formData.get("clientIP") || "unknown"
    const { data: rateLimitCheck } = await supabase.rpc("check_rate_limit", {
      p_identifier: clientIP.toString(),
      p_action: "login_attempt",
      p_max_attempts: 5,
      p_window_minutes: 15,
    })

    if (!rateLimitCheck) {
      return { error: "Too many login attempts. Please try again later." }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    })

    if (error) {
      // Log failed login attempt
      await supabase.from("audit_logs").insert({
        action: "login_failed",
        metadata: { email: email.toString(), error: error.message },
      })
      return { error: error.message }
    }

    // Log successful login
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "login_success",
        metadata: { email: email.toString() },
      })

      // Update last seen
      await supabase.from("user_profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", user.id)
    }

    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signUp(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")
  const fullName = formData.get("fullName")

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    // Check rate limiting
    const clientIP = formData.get("clientIP") || "unknown"
    const { data: rateLimitCheck } = await supabase.rpc("check_rate_limit", {
      p_identifier: clientIP.toString(),
      p_action: "signup_attempt",
      p_max_attempts: 3,
      p_window_minutes: 60,
    })

    if (!rateLimitCheck) {
      return { error: "Too many signup attempts. Please try again later." }
    }

    const { error } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
        data: {
          full_name: fullName?.toString() || email.toString(),
        },
      },
    })

    if (error) {
      return { error: error.message }
    }

    return { success: "Check your email to confirm your account." }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signOut() {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  // Log logout
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "logout",
      metadata: {},
    })
  }

  await supabase.auth.signOut()
  redirect("/auth/login")
}

export async function resetPassword(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")

  if (!email) {
    return { error: "Email is required" }
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.toString(), {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/reset-password`,
    })

    if (error) {
      return { error: error.message }
    }

    return { success: "Check your email for password reset instructions." }
  } catch (error) {
    console.error("Password reset error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function updatePassword(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const password = formData.get("password")

  if (!password) {
    return { error: "Password is required" }
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  try {
    const { error } = await supabase.auth.updateUser({
      password: password.toString(),
    })

    if (error) {
      return { error: error.message }
    }

    // Log password change
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "password_changed",
        metadata: {},
      })
    }

    return { success: "Password updated successfully." }
  } catch (error) {
    console.error("Password update error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}
