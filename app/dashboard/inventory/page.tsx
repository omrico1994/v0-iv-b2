import { getCurrentUser } from "@/lib/auth/get-user"
import { redirect } from "next/navigation"
import { InventoryDashboard } from "@/components/inventory/inventory-dashboard"

export default async function InventoryPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user has permission to view inventory
  const allowedRoles = ["system_admin", "medical_director", "department_head", "nurse"]
  if (!allowedRoles.includes(user.role)) {
    redirect("/dashboard?error=access_denied")
  }

  return <InventoryDashboard user={user} />
}
