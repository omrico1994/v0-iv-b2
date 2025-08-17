import { createServerClient } from "@/lib/supabase/server"

export async function getCurrentUserContext() {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role, retailer_id, location_id, sub_role")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!roleRow) return { userId: user.id, role: null }

  return {
    userId: user.id,
    role: roleRow.role,
    retailerId: roleRow.retailer_id,
    locationId: roleRow.location_id,
    subRole: roleRow.sub_role,
  }
}
