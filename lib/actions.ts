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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      redirect("/auth/login?error=Invalid email or password")
    }
  } catch (error) {
    redirect("/auth/login?error=Authentication failed. Please try again.")
  }

  redirect("/dashboard")
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
