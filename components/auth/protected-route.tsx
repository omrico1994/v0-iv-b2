"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { UserWithRole } from "@/lib/auth/get-user"
import { useAuthorization } from "@/lib/auth/authorization"
import type { Permission } from "@/lib/auth/permissions"

interface ProtectedRouteProps {
  children: React.ReactNode
  user: UserWithRole | null
  requiredPermission?: Permission
  requiredLocationAccess?: {
    locationId: string
    retailerId?: string
  }
  fallback?: React.ReactNode
}

export function ProtectedRoute({
  children,
  user,
  requiredPermission,
  requiredLocationAccess,
  fallback,
}: ProtectedRouteProps) {
  const router = useRouter()
  const auth = useAuthorization(user)
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    let authorized = true

    if (requiredPermission) {
      authorized = authorized && auth.hasPermission(requiredPermission)
    }

    if (requiredLocationAccess) {
      authorized =
        authorized && auth.canAccessLocation(requiredLocationAccess.locationId, requiredLocationAccess.retailerId)
    }

    setIsAuthorized(authorized)

    if (!authorized) {
      router.push("/dashboard?error=access_denied")
    }
  }, [user, requiredPermission, requiredLocationAccess, auth, router])

  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this resource.</p>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}
