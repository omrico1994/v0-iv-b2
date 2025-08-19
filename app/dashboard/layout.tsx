import type React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-user"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <DashboardSidebar user={user} />
        <div className="flex-1 flex flex-col">
          <DashboardHeader user={user} />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
