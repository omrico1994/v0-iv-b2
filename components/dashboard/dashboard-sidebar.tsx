import type { UserWithRole } from "@/lib/auth/get-user"
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  Activity,
  UserCheck,
  Stethoscope,
  ClipboardList,
  Package,
  BarChart3,
  Calendar,
  AlertTriangle,
} from "lucide-react"
import { SidebarNavigation } from "./sidebar-navigation"

interface DashboardSidebarProps {
  user: UserWithRole
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const getNavigationItems = () => {
    const baseItems = [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ]

    if (user.role === "system_admin") {
      return [
        ...baseItems,
        {
          name: "Staff Management",
          href: "/dashboard/staff",
          icon: Users,
        },
        {
          name: "Patient Management",
          href: "/dashboard/patients",
          icon: UserCheck,
        },
        {
          name: "IV Sessions",
          href: "/dashboard/iv-sessions",
          icon: Activity,
        },
        {
          name: "IV Monitoring",
          href: "/dashboard/iv-monitoring",
          icon: Stethoscope,
        },
        {
          name: "Inventory",
          href: "/dashboard/inventory",
          icon: Package,
        },
        {
          name: "Reports",
          href: "/dashboard/reports",
          icon: BarChart3,
        },
        {
          name: "System Settings",
          href: "/dashboard/settings",
          icon: Settings,
        },
        {
          name: "Audit Logs",
          href: "/dashboard/audit",
          icon: FileText,
        },
      ]
    }

    if (user.role === "medical_director" || user.role === "department_head") {
      return [
        ...baseItems,
        {
          name: "Staff Management",
          href: "/dashboard/staff",
          icon: Users,
        },
        {
          name: "Patient Management",
          href: "/dashboard/patients",
          icon: UserCheck,
        },
        {
          name: "IV Sessions",
          href: "/dashboard/iv-sessions",
          icon: Activity,
        },
        {
          name: "IV Monitoring",
          href: "/dashboard/iv-monitoring",
          icon: Stethoscope,
        },
        {
          name: "Inventory",
          href: "/dashboard/inventory",
          icon: Package,
        },
        {
          name: "Reports",
          href: "/dashboard/reports",
          icon: BarChart3,
        },
        {
          name: "Schedule",
          href: "/dashboard/schedule",
          icon: Calendar,
        },
      ]
    }

    if (user.role === "doctor") {
      return [
        ...baseItems,
        {
          name: "My Patients",
          href: "/dashboard/patients",
          icon: UserCheck,
        },
        {
          name: "IV Sessions",
          href: "/dashboard/iv-sessions",
          icon: Activity,
        },
        {
          name: "IV Monitoring",
          href: "/dashboard/iv-monitoring",
          icon: Stethoscope,
        },
        {
          name: "Schedule",
          href: "/dashboard/schedule",
          icon: Calendar,
        },
        {
          name: "Reports",
          href: "/dashboard/reports",
          icon: BarChart3,
        },
      ]
    }

    if (user.role === "nurse") {
      return [
        ...baseItems,
        {
          name: "My Patients",
          href: "/dashboard/patients",
          icon: UserCheck,
        },
        {
          name: "IV Sessions",
          href: "/dashboard/iv-sessions",
          icon: Activity,
        },
        {
          name: "IV Monitoring",
          href: "/dashboard/iv-monitoring",
          icon: Stethoscope,
        },
        {
          name: "Tasks",
          href: "/dashboard/tasks",
          icon: ClipboardList,
        },
        {
          name: "Alerts",
          href: "/dashboard/alerts",
          icon: AlertTriangle,
        },
        {
          name: "Schedule",
          href: "/dashboard/schedule",
          icon: Calendar,
        },
      ]
    }

    if (user.role === "technician") {
      return [
        ...baseItems,
        {
          name: "IV Monitoring",
          href: "/dashboard/iv-monitoring",
          icon: Stethoscope,
        },
        {
          name: "Equipment",
          href: "/dashboard/equipment",
          icon: Package,
        },
        {
          name: "Tasks",
          href: "/dashboard/tasks",
          icon: ClipboardList,
        },
        {
          name: "Alerts",
          href: "/dashboard/alerts",
          icon: AlertTriangle,
        },
      ]
    }

    return baseItems
  }

  const navigationItems = getNavigationItems()

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">IV Management System</h2>
        <p className="text-sm text-gray-600">{user.role.replace("_", " ").toUpperCase()}</p>
      </div>

      <SidebarNavigation items={navigationItems} />
    </div>
  )
}
