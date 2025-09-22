import { getCurrentUser } from "@/lib/auth/get-user"
import { redirect } from "next/navigation"
import { StaffDashboard } from "@/components/staff/staff-dashboard"

export default async function StaffPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user has permission to view staff management
  const allowedRoles = ["system_admin", "medical_director", "department_head"]
  if (!allowedRoles.includes(user.role)) {
    redirect("/dashboard?error=access_denied")
  }

  return <StaffDashboard user={user} />
}
