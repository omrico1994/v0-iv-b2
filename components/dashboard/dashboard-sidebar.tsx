import type { UserWithRole } from "@/lib/auth/get-user"
import { LayoutDashboard, Users, Settings, FileText, ShoppingCart, MapPin, Building2 } from "lucide-react"
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

    if (user.role === "admin") {
      return [
        ...baseItems,
        {
          name: "User Management",
          href: "/dashboard/users",
          icon: Users,
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
        {
          name: "Retailers",
          href: "/dashboard/retailers",
          icon: Building2,
        },
      ]
    }

    if (user.role === "office") {
      return [
        ...baseItems,
        {
          name: "Reports",
          href: "/dashboard/reports",
          icon: FileText,
        },
        {
          name: "Audit Logs",
          href: "/dashboard/audit",
          icon: FileText,
        },
        {
          name: "Retailers",
          href: "/dashboard/retailers",
          icon: Building2,
        },
      ]
    }

    if (user.role === "retailer") {
      return [
        ...baseItems,
        {
          name: "Locations",
          href: "/dashboard/locations",
          icon: MapPin,
        },
        {
          name: "Orders",
          href: "/dashboard/orders",
          icon: ShoppingCart,
        },
        {
          name: "Reports",
          href: "/dashboard/reports",
          icon: FileText,
        },
      ]
    }

    if (user.role === "location_user") {
      return [
        ...baseItems,
        {
          name: "Orders",
          href: "/dashboard/orders",
          icon: ShoppingCart,
        },
        {
          name: "My Locations",
          href: "/dashboard/my-locations",
          icon: MapPin,
        },
      ]
    }

    return baseItems
  }

  const navigationItems = getNavigationItems()

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">Business Portal</h2>
        <p className="text-sm text-gray-600">{user.role.replace("_", " ").toUpperCase()}</p>
      </div>

      <SidebarNavigation items={navigationItems} />
    </div>
  )
}
