"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Users, BarChart3, Shield, Settings, Activity, AlertTriangle, Menu, LogOut, Home, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Overview", href: "/admin", icon: Home },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Security", href: "/admin/security", icon: Shield },
  { name: "Activity Logs", href: "/admin/logs", icon: Activity },
  { name: "System Health", href: "/admin/health", icon: AlertTriangle },
  { name: "Audit Reports", href: "/admin/reports", icon: FileText },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

interface AdminSidebarProps {
  className?: string
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname()

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <h2 className="text-lg font-semibold text-sidebar-foreground">Admin Panel</h2>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>
      <div className="border-t border-sidebar-border p-4">
        <Button variant="outline" className="w-full justify-start gap-3 bg-transparent" size="sm">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn("hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0", className)}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden bg-transparent">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  )
}
