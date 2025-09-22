import { getCurrentUser } from "@/lib/auth/get-user"
import { redirect } from "next/navigation"
import { ScheduleDashboard } from "@/components/schedule/schedule-dashboard"

export default async function SchedulePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return <ScheduleDashboard user={user} />
}
