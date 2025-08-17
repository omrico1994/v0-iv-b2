"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [showAccessPending, setShowAccessPending] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    async function checkAuth() {
      try {
        const supabase = createClient()

        console.log("[v0] Starting auth check...")

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!isMounted) return

        console.log("[v0] User data:", user ? "User found" : "No user")

        if (!user) {
          console.log("[v0] No user, redirecting to login")
          router.replace("/auth/login")
          return
        }

        console.log("[v0] Checking user role for user ID:", user.id)
        const { data: roleRow, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle()

        if (!isMounted) return

        console.log("[v0] Role query result:", { roleRow, roleError })

        if (roleError) {
          console.error("[v0] Role query error:", roleError)
          setShowAccessPending(true)
          setIsLoading(false)
          return
        }

        if (!roleRow?.role) {
          console.log("[v0] No role found, showing access pending")
          setShowAccessPending(true)
          setIsLoading(false)
          return
        }

        console.log("[v0] Role found:", roleRow.role, "redirecting to dashboard")
        router.replace(`/dashboard/${roleRow.role}`)
      } catch (error) {
        if (!isMounted) return
        console.error("[v0] Auth check failed:", error)
        setIsLoading(false)
        setShowAccessPending(true)
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
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

  if (showAccessPending) {
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

  return null
}
