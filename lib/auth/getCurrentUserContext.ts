import { createServerClient, createServiceRoleClient } from "@/lib/supabase/server"

export async function getCurrentUserContext() {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const serviceSupabase = createServiceRoleClient()

  const { data: roleRow, error: roleError } = await serviceSupabase
    .from("user_roles")
    .select("role, retailer_id, location_id, sub_role")
    .eq("user_id", user.id)
    .maybeSingle()

  console.log("[v0] Service role query result:", { roleRow, roleError })

  if (roleError) {
    console.error("[v0] Service role query error:", roleError)
    return { userId: user.id, role: null }
  }

  if (!roleRow) return { userId: user.id, role: null }

  return {
    userId: user.id,
    role: roleRow.role,
    retailerId: roleRow.retailer_id,
    locationId: roleRow.location_id,
    subRole: roleRow.sub_role,
  }
}
