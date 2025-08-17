"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertTriangle, XCircle, Server, Database, Wifi } from "lucide-react"

interface SystemHealthProps {
  health: {
    database: "healthy" | "warning" | "error"
    api: "healthy" | "warning" | "error"
    auth: "healthy" | "warning" | "error"
    storage: "healthy" | "warning" | "error"
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
  }
}

export function SystemHealth({ health }: SystemHealthProps) {
  const getStatusIcon = (status: "healthy" | "warning" | "error") => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-chart-2" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-chart-3" />
      case "error":
        return <XCircle className="h-4 w-4 text-chart-4" />
    }
  }

  const getStatusBadge = (status: "healthy" | "warning" | "error") => {
    const variants = {
      healthy: "bg-chart-2 text-white",
      warning: "bg-chart-3 text-white",
      error: "bg-chart-4 text-white",
    }
    return <Badge className={variants[status]}>{status}</Badge>
  }

  const services = [
    { name: "Database", status: health.database, icon: Database },
    { name: "API Services", status: health.api, icon: Server },
    { name: "Authentication", status: health.auth, icon: Wifi },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Service Status</CardTitle>
          <CardDescription>Current status of system services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {services.map((service) => (
            <div key={service.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <service.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{service.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(service.status)}
                {getStatusBadge(service.status)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Resource Usage</CardTitle>
          <CardDescription>Current system resource utilization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>CPU Usage</span>
              <span>{health.cpuUsage}%</span>
            </div>
            <Progress value={health.cpuUsage} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Memory Usage</span>
              <span>{health.memoryUsage}%</span>
            </div>
            <Progress value={health.memoryUsage} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Disk Usage</span>
              <span>{health.diskUsage}%</span>
            </div>
            <Progress value={health.diskUsage} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
