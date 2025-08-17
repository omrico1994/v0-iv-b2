"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function signIn(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const supabase = createServerActionClient({ cookies })

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: "We couldn't sign you in. Check your email or password and try again." }
  }

  if (data.user) {
    // Get user role
    const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).maybeSingle()

    if (roleRow?.role) {
      redirect(`/dashboard/${roleRow.role}`)
    } else {
      redirect("/")
    }
  }

  return { success: true }
}

export async function signOut() {
  const supabase = createServerActionClient({ cookies })
  await supabase.auth.signOut()
  redirect("/auth/login")
}
