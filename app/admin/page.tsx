import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { StatsCards } from "@/components/admin/stats-cards"
import { SystemHealth } from "@/components/admin/system-health"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminDashboard() {
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

  // Fetch admin statistics
  const { data: userStats } = await supabase.from("user_profiles").select("id, created_at, last_seen_at, is_active")

  const totalUsers = userStats?.length || 0
  const newUsers =
    userStats?.filter((u) => {
      const createdAt = new Date(u.created_at)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return createdAt > thirtyDaysAgo
    }).length || 0

  const activeUsers =
    userStats?.filter((u) => {
      if (!u.last_seen_at) return false
      const lastSeen = new Date(u.last_seen_at)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return lastSeen > thirtyDaysAgo
    }).length || 0

  const stats = {
    totalUsers,
    newUsers,
    activeUsers,
    securityAlerts: 3, // This would come from security monitoring
  }

  const health = {
    database: "healthy" as const,
    api: "healthy" as const,
    auth: "healthy" as const,
    storage: "healthy" as const,
    cpuUsage: 45,
    memoryUsage: 62,
    diskUsage: 78,
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 lg:pl-64">
        <div className="flex h-14 items-center justify-between border-b px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <AdminSidebar className="lg:hidden" />
            <h1 className="text-lg font-semibold">Admin Dashboard</h1>
          </div>
        </div>
        <main className="flex-1 space-y-6 p-4 lg:p-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
            <p className="text-muted-foreground">Monitor your application's performance and manage users.</p>
          </div>

          <StatsCards stats={stats} />

          <SystemHealth health={health} />

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground">Recent Activity</CardTitle>
              <CardDescription>Latest user activities and system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="h-2 w-2 rounded-full bg-chart-2" />
                  <span className="text-muted-foreground">2 minutes ago</span>
                  <span>New user registration: john@example.com</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="h-2 w-2 rounded-full bg-chart-3" />
                  <span className="text-muted-foreground">5 minutes ago</span>
                  <span>Password reset requested by user@example.com</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="h-2 w-2 rounded-full bg-chart-1" />
                  <span className="text-muted-foreground">10 minutes ago</span>
                  <span>System backup completed successfully</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
