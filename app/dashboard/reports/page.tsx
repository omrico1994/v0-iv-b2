import { getCurrentUser } from "@/lib/auth/get-user"
import { redirect } from "next/navigation"
import { ReportsDashboard } from "@/components/reports/reports-dashboard"

export default async function ReportsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user has permission to view reports
  const allowedRoles = ["system_admin", "medical_director", "department_head", "doctor", "office"]
  if (!allowedRoles.includes(user.role)) {
    redirect("/dashboard?error=access_denied")
  }

  return <ReportsDashboard user={user} />
}
