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

export const PERMISSIONS = {
  // User Management
  MANAGE_USERS: "users:create" as Permission,
  VIEW_USERS: "users:read" as Permission,
  UPDATE_USERS: "users:update" as Permission,
  DELETE_USERS: "users:delete" as Permission,

  // Order Management
  CREATE_ORDERS: "orders:create" as Permission,
  VIEW_ORDERS: "orders:read" as Permission,
  UPDATE_ORDERS: "orders:update" as Permission,
  DELETE_ORDERS: "orders:delete" as Permission,

  // Repair Management
  CREATE_REPAIRS: "repairs:create" as Permission,
  VIEW_REPAIRS: "repairs:read" as Permission,
  UPDATE_REPAIRS: "repairs:update" as Permission,
  DELETE_REPAIRS: "repairs:delete" as Permission,
  HANDLE_REPAIRS: "repairs:update" as Permission,

  // Claims Management
  CREATE_CLAIMS: "claims:create" as Permission,
  VIEW_CLAIMS: "claims:read" as Permission,
  UPDATE_CLAIMS: "claims:update" as Permission,
  DELETE_CLAIMS: "claims:delete" as Permission,

  // Location Management
  CREATE_LOCATIONS: "locations:create" as Permission,
  VIEW_LOCATIONS: "locations:read" as Permission,
  UPDATE_LOCATIONS: "locations:update" as Permission,
  DELETE_LOCATIONS: "locations:delete" as Permission,

  // Retailer Management
  CREATE_RETAILERS: "retailers:create" as Permission,
  VIEW_RETAILERS: "retailers:read" as Permission,
  UPDATE_RETAILERS: "retailers:update" as Permission,
  DELETE_RETAILERS: "retailers:delete" as Permission,

  // Reporting
  VIEW_REPORTS: "reports:read" as Permission,
  EXPORT_REPORTS: "reports:export" as Permission,

  // System
  SYSTEM_SETTINGS: "system:settings" as Permission,
  SYSTEM_AUDIT: "system:audit" as Permission,
} as const

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
