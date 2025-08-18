"use server"

import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function signIn(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  console.log("[v0] Server action signIn called with email:", email)

  if (!email || !password) {
    console.log("[v0] Missing email or password")
    return { error: "Email and password are required" }
  }

  try {
    console.log("[v0] Creating Supabase server client...")
    const supabase = createServerClient()
    console.log("[v0] Supabase client created successfully")

    console.log("[v0] Attempting signInWithPassword...")
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log("[v0] Supabase response - data:", data)
    console.log("[v0] Supabase response - error:", error)

    if (error) {
      console.log("[v0] Authentication failed with error:", error.message, error.status)
      return { error: "We couldn't sign you in. Check your email or password and try again." }
    }

    if (data.user) {
      console.log("[v0] Authentication successful, user:", data.user.id)
      redirect("/")
    }

    console.log("[v0] No user returned despite no error")
    return { success: true }
  } catch (err) {
    console.log("[v0] Server action caught exception:", err)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signOut() {
  const supabase = createServerClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}

export async function resetPassword(prevState: any, formData: FormData) {
  const email = formData.get("email") as string

  if (!email) {
    return { error: "Email is required" }
  }

  const supabase = createServerClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/update-password`,
  })

  if (error) {
    return { error: "There was an error sending the reset email. Please try again." }
  }

  return { success: "If there's an account for that email, a reset link has been sent." }
}
