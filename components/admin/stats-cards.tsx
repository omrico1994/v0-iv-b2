"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserPlus, Activity, Shield } from "lucide-react"

interface StatsCardsProps {
  stats: {
    totalUsers: number
    newUsers: number
    activeUsers: number
    securityAlerts: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      description: "Registered users",
      icon: Users,
      color: "text-chart-1",
    },
    {
      title: "New Users",
      value: stats.newUsers.toLocaleString(),
      description: "This month",
      icon: UserPlus,
      color: "text-chart-2",
    },
    {
      title: "Active Users",
      value: stats.activeUsers.toLocaleString(),
      description: "Last 30 days",
      icon: Activity,
      color: "text-chart-3",
    },
    {
      title: "Security Alerts",
      value: stats.securityAlerts.toLocaleString(),
      description: "Requires attention",
      icon: Shield,
      color: "text-chart-4",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
