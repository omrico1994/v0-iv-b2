import { getCurrentUser } from "@/lib/auth/get-user"
import { redirect } from "next/navigation"
import { EquipmentDashboard } from "@/components/equipment/equipment-dashboard"

export default async function EquipmentPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user has permission to view equipment
  const allowedRoles = ["system_admin", "medical_director", "department_head", "technician"]
  if (!allowedRoles.includes(user.role)) {
    redirect("/dashboard?error=access_denied")
  }

  return <EquipmentDashboard user={user} />
}
