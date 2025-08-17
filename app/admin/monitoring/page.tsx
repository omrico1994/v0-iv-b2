import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { MonitoringDashboard } from "@/components/monitoring/monitoring-dashboard"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AdminMonitoringPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 lg:pl-64">
        <div className="flex h-14 items-center justify-between border-b px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <AdminSidebar className="lg:hidden" />
            <h1 className="text-lg font-semibold">System Monitoring</h1>
          </div>
        </div>
        <main className="flex-1 space-y-6 p-4 lg:p-6">
          <MonitoringDashboard />
        </main>
      </div>
    </div>
  )
}
