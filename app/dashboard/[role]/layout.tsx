import type React from "react"
import { DashboardHeader } from "@/components/navigation/dashboard-header"

interface DashboardLayoutProps {
  children: React.ReactNode
  params: {
    role: "owner" | "retailer" | "location_staff" | "backoffice"
  }
}

export default function DashboardLayout({ children, params }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader role={params.role} />
      <main>{children}</main>
    </div>
  )
}
