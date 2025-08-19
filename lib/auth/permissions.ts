export type Permission =
  // User Management
  | "users:create"
  | "users:read"
  | "users:update"
  | "users:delete"
  // Order Management
  | "orders:create"
  | "orders:read"
  | "orders:update"
  | "orders:delete"
  // Repair Management
  | "repairs:create"
  | "repairs:read"
  | "repairs:update"
  | "repairs:delete"
  // Claims Management (Admin/Office only)
  | "claims:create"
  | "claims:read"
  | "claims:update"
  | "claims:delete"
  // Location Management
  | "locations:create"
  | "locations:read"
  | "locations:update"
  | "locations:delete"
  // Retailer Management
  | "retailers:create"
  | "retailers:read"
  | "retailers:update"
  | "retailers:delete"
  // Reporting
  | "reports:read"
  | "reports:export"
  // System
  | "system:settings"
  | "system:audit"

export type Role = "admin" | "office" | "retailer" | "location_user"

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    // Full access to everything
    "users:create",
    "users:read",
    "users:update",
    "users:delete",
    "orders:create",
    "orders:read",
    "orders:update",
    "orders:delete",
    "repairs:create",
    "repairs:read",
    "repairs:update",
    "repairs:delete",
    "claims:create",
    "claims:read",
    "claims:update",
    "claims:delete",
    "locations:create",
    "locations:read",
    "locations:update",
    "locations:delete",
    "retailers:create",
    "retailers:read",
    "retailers:update",
    "retailers:delete",
    "reports:read",
    "reports:export",
    "system:settings",
    "system:audit",
  ],
  office: [
    // Same as admin for now (as requested)
    "users:create",
    "users:read",
    "users:update",
    "users:delete",
    "orders:create",
    "orders:read",
    "orders:update",
    "orders:delete",
    "repairs:create",
    "repairs:read",
    "repairs:update",
    "repairs:delete",
    "claims:create",
    "claims:read",
    "claims:update",
    "claims:delete",
    "locations:create",
    "locations:read",
    "locations:update",
    "locations:delete",
    "retailers:create",
    "retailers:read",
    "retailers:update",
    "retailers:delete",
    "reports:read",
    "reports:export",
    "system:settings",
    "system:audit",
  ],
  retailer: [
    // Can manage their locations and location users
    "users:create",
    "users:read",
    "users:update", // Only for location users in their locations
    "orders:read",
    "orders:update", // For their locations only
    "repairs:create",
    "repairs:read",
    "repairs:update",
    "repairs:delete",
    "locations:read",
    "locations:update", // Only their assigned locations
    "reports:read", // Only for their locations
  ],
  location_user: [
    // Limited to their specific location
    "orders:create",
    "orders:read", // Only for their location
    "repairs:create",
    "repairs:read",
    "repairs:update", // Only for orders in their location
  ],
}

export function hasPermission(userRole: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole].includes(permission)
}

export function hasAnyPermission(userRole: Role, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(userRole, permission))
}

export function hasAllPermissions(userRole: Role, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(userRole, permission))
}

// Check if user can access specific location
export function canAccessLocation(
  userRole: Role,
  userRetailerId?: string,
  userLocations?: Array<{ id: string }>,
  targetLocationId?: string,
  targetRetailerId?: string,
): boolean {
  // Admin and office can access all locations
  if (userRole === "admin" || userRole === "office") {
    return true
  }

  // Retailer can access their assigned locations
  if (userRole === "retailer") {
    return userRetailerId === targetRetailerId
  }

  // Location user can only access their specific locations
  if (userRole === "location_user") {
    return userLocations?.some((loc) => loc.id === targetLocationId) ?? false
  }

  return false
}

// Check if user can manage other users
export function canManageUser(
  managerRole: Role,
  managerRetailerId?: string,
  targetUserRole?: Role,
  targetUserRetailerId?: string,
): boolean {
  // Admin and office can manage all users
  if (managerRole === "admin" || managerRole === "office") {
    return true
  }

  // Retailer can only manage location users in their locations
  if (managerRole === "retailer") {
    return targetUserRole === "location_user" && managerRetailerId === targetUserRetailerId
  }

  // Location users cannot manage other users
  return false
}
