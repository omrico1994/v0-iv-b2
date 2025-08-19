"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
}

interface SidebarNavigationProps {
  items: NavigationItem[]
}

export function SidebarNavigation({ items }: SidebarNavigationProps) {
  const pathname = usePathname()

  return (
    <nav className="px-4 space-y-2">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}
