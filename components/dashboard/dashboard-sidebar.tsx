"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { UserWithRole } from "@/lib/auth/get-user"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Settings, FileText, ShoppingCart, MapPin, Building2 } from "lucide-react"

interface DashboardSidebarProps {
  user: UserWithRole
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname()

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
    <div className="w-64 bg-sidebar border-r border-sidebar-border">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-sidebar-foreground">Business Portal</h2>
        <p className="text-sm text-sidebar-foreground/70">{user.role.replace("_", " ").toUpperCase()}</p>
      </div>

      <nav className="px-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
