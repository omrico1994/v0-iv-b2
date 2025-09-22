"use server"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user"
import { revalidatePath } from "next/cache"

export interface LocationData {
  name: string
  retailerId: string
  fullAddress: string
  phone?: string
  timezone: string
  operatingHours?: {
    monday?: { open: string; close: string; closed?: boolean }
    tuesday?: { open: string; close: string; closed?: boolean }
    wednesday?: { open: string; close: string; closed?: boolean }
    thursday?: { open: string; close: string; closed?: boolean }
    friday?: { open: string; close: string; closed?: boolean }
    saturday?: { open: string; close: string; closed?: boolean }
    sunday?: { open: string; close: string; closed?: boolean }
  }
}

export async function getLocationsWithRetailers() {
  try {
    const supabase = createClient()
    const currentUser = await getCurrentUser()

    if (!currentUser || !["admin", "office"].includes(currentUser.role)) {
      return { error: "Unauthorized to view locations" }
    }

    // Optimized query with better join structure and selective fields
    const { data: locations, error } = await supabase
      .from("locations")
      .select(`
        id,
        name,
        full_address,
        phone,
        timezone,
        is_active,
        operating_hours,
        created_at,
        retailers!inner (
          id,
          name,
          business_name
        ),
        user_location_memberships!left (
          user_id,
          is_active,
          user_profiles!inner (
            first_name,
            last_name,
            user_roles (
              role
            )
          )
        )
      `)
      .eq("retailers.is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error fetching locations:", error)
      return { error: "Failed to fetch locations" }
    }

    return { success: true, locations }
  } catch (error) {
    console.error("Error fetching locations:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function getRetailers() {
  try {
    const supabase = createClient()
    const currentUser = await getCurrentUser()

    if (!currentUser || !["admin", "office"].includes(currentUser.role)) {
      return { error: "Unauthorized to view retailers" }
    }

    // Simple, efficient query for retailers with proper indexing
    const { data: retailers, error } = await supabase
      .from("retailers")
      .select("id, name, business_name")
      .eq("is_active", true)
      .order("business_name")

    if (error) {
      console.error("Database error fetching retailers:", error)
      return { error: "Failed to fetch retailers" }
    }

    return { success: true, retailers }
  } catch (error) {
    console.error("Error fetching retailers:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function createLocation(locationData: LocationData) {
  try {
    const supabase = createServiceClient()
    if (!supabase) {
      return { error: "Service client not configured" }
    }

    const currentUser = await getCurrentUser()

    if (!currentUser || !["admin", "office"].includes(currentUser.role)) {
      return { error: "Unauthorized to create locations" }
    }

    // Validate required fields
    if (!locationData.name || !locationData.retailerId || !locationData.fullAddress || !locationData.timezone) {
      return { error: "Missing required fields" }
    }

    // Create location
    const { data: location, error: locationError } = await supabase
      .from("locations")
      .insert({
        name: locationData.name,
        retailer_id: locationData.retailerId,
        full_address: locationData.fullAddress,
        phone: locationData.phone || null,
        timezone: locationData.timezone,
        operating_hours: locationData.operatingHours || null,
        is_active: true,
      })
      .select()
      .single()

    if (locationError || !location) {
      return { error: "Failed to create location" }
    }

    // Log audit trail
    await supabase.from("audit_logs").insert({
      user_id: currentUser.id,
      action: "CREATE",
      table_name: "locations",
      record_id: location.id,
      new_data: {
        name: locationData.name,
        retailer_id: locationData.retailerId,
        full_address: locationData.fullAddress,
      },
    })

    revalidatePath("/dashboard/admin/locations")
    return { success: "Location created successfully", location }
  } catch (error) {
    console.error("Error creating location:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function updateLocation(locationId: string, locationData: Partial<LocationData>) {
  try {
    const supabase = createServiceClient()
    if (!supabase) {
      return { error: "Service client not configured" }
    }

    const currentUser = await getCurrentUser()

    if (!currentUser || !["admin", "office"].includes(currentUser.role)) {
      return { error: "Unauthorized to update locations" }
    }

    // Get current location data for audit trail
    const { data: currentLocation } = await supabase.from("locations").select("*").eq("id", locationId).single()

    if (!currentLocation) {
      return { error: "Location not found" }
    }

    // Update location
    const updateData: any = {}
    if (locationData.name) updateData.name = locationData.name
    if (locationData.fullAddress) updateData.full_address = locationData.fullAddress
    if (locationData.phone !== undefined) updateData.phone = locationData.phone || null
    if (locationData.timezone) updateData.timezone = locationData.timezone
    if (locationData.operatingHours !== undefined) updateData.operating_hours = locationData.operatingHours || null

    const { data: location, error: locationError } = await supabase
      .from("locations")
      .update(updateData)
      .eq("id", locationId)
      .select()
      .single()

    if (locationError || !location) {
      return { error: "Failed to update location" }
    }

    // Log audit trail
    await supabase.from("audit_logs").insert({
      user_id: currentUser.id,
      action: "UPDATE",
      table_name: "locations",
      record_id: locationId,
      old_data: currentLocation,
      new_data: updateData,
    })

    revalidatePath("/dashboard/admin/locations")
    return { success: "Location updated successfully", location }
  } catch (error) {
    console.error("Error updating location:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function toggleLocationStatus(locationId: string) {
  try {
    const supabase = createServiceClient()
    if (!supabase) {
      return { error: "Service client not configured" }
    }

    const currentUser = await getCurrentUser()

    if (!currentUser || !["admin", "office"].includes(currentUser.role)) {
      return { error: "Unauthorized to modify locations" }
    }

    // Get current status
    const { data: currentLocation } = await supabase.from("locations").select("is_active").eq("id", locationId).single()

    if (!currentLocation) {
      return { error: "Location not found" }
    }

    // Toggle status
    const newStatus = !currentLocation.is_active
    const { error: updateError } = await supabase
      .from("locations")
      .update({ is_active: newStatus })
      .eq("id", locationId)

    if (updateError) {
      return { error: "Failed to update location status" }
    }

    // Log audit trail
    await supabase.from("audit_logs").insert({
      user_id: currentUser.id,
      action: "UPDATE",
      table_name: "locations",
      record_id: locationId,
      old_data: { is_active: currentLocation.is_active },
      new_data: { is_active: newStatus },
    })

    revalidatePath("/dashboard/admin/locations")
    return { success: `Location ${newStatus ? "activated" : "deactivated"} successfully` }
  } catch (error) {
    console.error("Error toggling location status:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function assignUserToLocation(userId: string, locationId: string) {
  try {
    const supabase = createServiceClient()
    if (!supabase) {
      return { error: "Service client not configured" }
    }

    const currentUser = await getCurrentUser()

    if (!currentUser || !["admin", "office", "retailer"].includes(currentUser.role)) {
      return { error: "Unauthorized to assign users" }
    }

    // Check if assignment already exists
    const { data: existing } = await supabase
      .from("user_location_memberships")
      .select("*")
      .eq("user_id", userId)
      .eq("location_id", locationId)
      .single()

    if (existing) {
      // Reactivate if exists but inactive
      if (!existing.is_active) {
        const { error: updateError } = await supabase
          .from("user_location_memberships")
          .update({ is_active: true })
          .eq("user_id", userId)
          .eq("location_id", locationId)

        if (updateError) {
          return { error: "Failed to reactivate user assignment" }
        }
      } else {
        return { error: "User is already assigned to this location" }
      }
    } else {
      // Create new assignment
      const { error: insertError } = await supabase.from("user_location_memberships").insert({
        user_id: userId,
        location_id: locationId,
        is_active: true,
      })

      if (insertError) {
        return { error: "Failed to assign user to location" }
      }
    }

    // Log audit trail
    await supabase.from("audit_logs").insert({
      user_id: currentUser.id,
      action: "CREATE",
      table_name: "user_location_memberships",
      record_id: `${userId}-${locationId}`,
      new_data: {
        user_id: userId,
        location_id: locationId,
        is_active: true,
      },
    })

    revalidatePath("/dashboard/admin/locations")
    return { success: "User assigned to location successfully" }
  } catch (error) {
    console.error("Error assigning user to location:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function removeUserFromLocation(userId: string, locationId: string) {
  try {
    const supabase = createServiceClient()
    if (!supabase) {
      return { error: "Service client not configured" }
    }

    const currentUser = await getCurrentUser()

    if (!currentUser || !["admin", "office", "retailer"].includes(currentUser.role)) {
      return { error: "Unauthorized to remove user assignments" }
    }

    // Deactivate assignment instead of deleting
    const { error: updateError } = await supabase
      .from("user_location_memberships")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("location_id", locationId)

    if (updateError) {
      return { error: "Failed to remove user from location" }
    }

    // Log audit trail
    await supabase.from("audit_logs").insert({
      user_id: currentUser.id,
      action: "UPDATE",
      table_name: "user_location_memberships",
      record_id: `${userId}-${locationId}`,
      old_data: { is_active: true },
      new_data: { is_active: false },
    })

    revalidatePath("/dashboard/admin/locations")
    return { success: "User removed from location successfully" }
  } catch (error) {
    console.error("Error removing user from location:", error)
    return { error: "An unexpected error occurred" }
  }
}
