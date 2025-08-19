import { getCurrentUser, type UserWithRole } from "./get-user"
import { hasPermission as checkPermission, canAccessLocation, type Permission } from "./permissions"
import { redirect } from "next/navigation"

export { checkPermission as hasPermission } from "./permissions"

export class AuthorizationError extends Error {
  constructor(message = "Access denied") {
    super(message)
    this.name = "AuthorizationError"
  }
}

// Server-side authorization check
export async function requireAuth(): Promise<UserWithRole> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/login")
  }
  return user
}

// Server-side permission check
export async function requirePermission(permission: Permission): Promise<UserWithRole> {
  const user = await requireAuth()

  if (!checkPermission(user.role, permission)) {
    throw new AuthorizationError(`Permission denied: ${permission}`)
  }

  return user
}

// Server-side location access check
export async function requireLocationAccess(locationId: string, retailerId?: string): Promise<UserWithRole> {
  const user = await requireAuth()

  if (!canAccessLocation(user.role, user.retailer_id, user.locations, locationId, retailerId)) {
    throw new AuthorizationError("Access denied to this location")
  }

  return user
}

// Client-side authorization hook (for components)
export function useAuthorization(user: UserWithRole | null) {
  return {
    hasPermission: (permission: Permission) => (user ? checkPermission(user.role, permission) : false),

    canAccessLocation: (locationId: string, retailerId?: string) =>
      user ? canAccessLocation(user.role, user.retailer_id, user.locations, locationId, retailerId) : false,

    isAdmin: () => user?.role === "admin",
    isOffice: () => user?.role === "office",
    isRetailer: () => user?.role === "retailer",
    isLocationUser: () => user?.role === "location_user",
    isAdminOrOffice: () => user?.role === "admin" || user?.role === "office",
  }
}

// Route protection utility
export function createProtectedRoute(
  permission?: Permission,
  locationCheck?: { locationId: string; retailerId?: string },
) {
  return async function protectedRoute() {
    if (permission) {
      await requirePermission(permission)
    }

    if (locationCheck) {
      await requireLocationAccess(locationCheck.locationId, locationCheck.retailerId)
    }

    return requireAuth()
  }
}
