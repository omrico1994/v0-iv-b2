"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient()

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle()

        if (!roleRow?.role) {
          // Show access pending screen
          setIsLoading(false)
          return
        }

        router.push(`/dashboard/${roleRow.role}`)
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/auth/login")
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Access pending screen for users without roles
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access pending</h1>
          <p className="text-gray-600">
            Your account is active but not yet assigned a role. Please contact your administrator to complete setup.
          </p>
        </div>
      </div>
    </div>
  )
}
