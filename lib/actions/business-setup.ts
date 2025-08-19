"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export interface BusinessSetupData {
  businessName: string
  fullAddress: string
  businessPhone: string
  businessEmail?: string
  website?: string
  taxId?: string
  contactPerson: string
}

export interface LocationSetupData {
  locationName: string
  fullAddress: string
  phone?: string
  timezone: string
  operatingHours?: Record<string, any>
}

export async function completeBusinessSetup(prevState: any, formData: FormData) {
  try {
    const supabase = createClient()
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.role !== "retailer") {
      return { error: "Only retailers can complete business setup" }
    }

    if (currentUser.business_setup_completed) {
      return { error: "Business setup already completed" }
    }

    const businessData: BusinessSetupData = {
      businessName: formData.get("businessName") as string,
      fullAddress: formData.get("fullAddress") as string,
      businessPhone: formData.get("businessPhone") as string,
      businessEmail: (formData.get("businessEmail") as string) || undefined,
      website: (formData.get("website") as string) || undefined,
      taxId: (formData.get("taxId") as string) || undefined,
      contactPerson: formData.get("contactPerson") as string,
    }

    const locationData: LocationSetupData = {
      locationName: formData.get("locationName") as string,
      fullAddress: formData.get("locationAddress") as string,
      phone: (formData.get("locationPhone") as string) || undefined,
      timezone: formData.get("timezone") as string,
      operatingHours: formData.get("operatingHours") ? JSON.parse(formData.get("operatingHours") as string) : undefined,
    }

    // Validate required fields
    if (
      !businessData.businessName ||
      !businessData.fullAddress ||
      !businessData.businessPhone ||
      !businessData.contactPerson
    ) {
      return { error: "Missing required business information" }
    }

    if (!locationData.locationName || !locationData.fullAddress || !locationData.timezone) {
      return { error: "Missing required location information" }
    }

    // Get retailer record
    const { data: retailer, error: retailerError } = await supabase
      .from("retailers")
      .select("id")
      .eq("id", currentUser.retailer_id)
      .single()

    if (retailerError || !retailer) {
      return { error: "Retailer business not found" }
    }

    // Update retailer business information
    const { error: updateError } = await supabase
      .from("retailers")
      .update({
        business_name: businessData.businessName,
        full_address: businessData.fullAddress,
        business_phone: businessData.businessPhone,
        business_email: businessData.businessEmail || currentUser.email,
        website: businessData.website,
        tax_id: businessData.taxId,
        contact_person: businessData.contactPerson,
      })
      .eq("id", retailer.id)

    if (updateError) {
      return { error: "Failed to update business information" }
    }

    // Create first location
    const { data: location, error: locationError } = await supabase
      .from("locations")
      .insert({
        retailer_id: retailer.id,
        location_name: locationData.locationName,
        full_address: locationData.fullAddress,
        phone: locationData.phone,
        timezone: locationData.timezone,
        operating_hours: locationData.operatingHours,
      })
      .select("id")
      .single()

    if (locationError || !location) {
      return { error: "Failed to create first location" }
    }

    // Mark business setup as completed
    const { error: profileError } = await supabase
      .from("user_profiles")
      .update({ business_setup_completed: true })
      .eq("id", currentUser.id)

    if (profileError) {
      return { error: "Failed to complete setup process" }
    }

    // Log audit trail
    await supabase.from("audit_logs").insert({
      user_id: currentUser.id,
      action: "UPDATE",
      table_name: "retailers",
      record_id: retailer.id,
      new_data: { business_setup_completed: true },
    })

    revalidatePath("/dashboard")
    redirect("/dashboard")
  } catch (error) {
    console.error("Error completing business setup:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function createLocation(prevState: any, formData: FormData) {
  try {
    const supabase = createClient()
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.role !== "retailer") {
      return { error: "Only retailers can create locations" }
    }

    const locationData: LocationSetupData = {
      locationName: formData.get("locationName") as string,
      fullAddress: formData.get("fullAddress") as string,
      phone: (formData.get("phone") as string) || undefined,
      timezone: formData.get("timezone") as string,
      operatingHours: formData.get("operatingHours") ? JSON.parse(formData.get("operatingHours") as string) : undefined,
    }

    // Validate required fields
    if (!locationData.locationName || !locationData.fullAddress || !locationData.timezone) {
      return { error: "Missing required location information" }
    }

    // Create location
    const { error: locationError } = await supabase.from("locations").insert({
      retailer_id: currentUser.retailer_id,
      location_name: locationData.locationName,
      full_address: locationData.fullAddress,
      phone: locationData.phone,
      timezone: locationData.timezone,
      operating_hours: locationData.operatingHours,
    })

    if (locationError) {
      return { error: "Failed to create location" }
    }

    // Log audit trail
    await supabase.from("audit_logs").insert({
      user_id: currentUser.id,
      action: "CREATE",
      table_name: "locations",
      record_id: null, // We don't have the ID from insert
      new_data: locationData,
    })

    revalidatePath("/dashboard/locations")
    return { success: "Location created successfully" }
  } catch (error) {
    console.error("Error creating location:", error)
    return { error: "An unexpected error occurred" }
  }
}
