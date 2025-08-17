"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, AlertTriangle, CheckCircle, Users, Zap } from "lucide-react"

interface MonitoringData {
  errors: {
    total: number
    recent: number
    criticalErrors: Array<{
      id: string
      message: string
      timestamp: string
      count: number
    }>
  }
  performance: {
    averageLoadTime: number
    p95LoadTime: number
    errorRate: number
    uptime: number
  }
  users: {
    activeUsers: number
    totalSessions: number
    bounceRate: number
  }
  system: {
    cpuUsage: number
    memoryUsage: number
    responseTime: number
    status: "healthy" | "warning" | "critical"
  }
}

export function MonitoringDashboard() {
  const [data, setData] = useState<MonitoringData>({
    errors: {
      total: 42,
      recent: 3,
      criticalErrors: [
        {
          id: "1",
          message: "Database connection timeout",
          timestamp: "2 minutes ago",
          count: 5,
        },
        {
          id: "2",
          message: "Authentication service unavailable",
          timestamp: "15 minutes ago",
          count: 2,
        },
      ],
    },
    performance: {
      averageLoadTime: 1.2,
      p95LoadTime: 2.8,
      errorRate: 0.5,
      uptime: 99.9,
    },
    users: {
      activeUsers: 1247,
      totalSessions: 3891,
      bounceRate: 23.4,
    },
    system: {
      cpuUsage: 45,
      memoryUsage: 62,
      responseTime: 120,
      status: "healthy",
    },
  })

  const [realTimeErrors, setRealTimeErrors] = useState<number>(0)

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setRealTimeErrors((prev) => prev + Math.floor(Math.random() * 2))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-chart-2"
      case "warning":
        return "text-chart-3"
      case "critical":
        return "text-chart-4"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-chart-2" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-chart-3" />
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-chart-4" />
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">System Monitoring</h2>
        <div className="flex items-center gap-2">
          {getStatusIcon(data.system.status)}
          <Badge className={getStatusColor(data.system.status)}>
            System {data.system.status.charAt(0).toUpperCase() + data.system.status.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Real-time Alerts */}
      {realTimeErrors > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {realTimeErrors} new error{realTimeErrors > 1 ? "s" : ""} detected in the last few minutes.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{data.system.status}</div>
                <p className="text-xs text-muted-foreground">All systems operational</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.performance.uptime}%</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.users.activeUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Currently online</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.system.responseTime}ms</div>
                <p className="text-xs text-muted-foreground">Average response</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
                <CardDescription>Current system resource utilization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CPU Usage</span>
                    <span>{data.system.cpuUsage}%</span>
                  </div>
                  <Progress value={data.system.cpuUsage} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Memory Usage</span>
                    <span>{data.system.memoryUsage}%</span>
                  </div>
                  <Progress value={data.system.memoryUsage} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Errors</CardTitle>
                <CardDescription>Critical errors requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.errors.criticalErrors.map((error) => (
                    <div key={error.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{error.message}</p>
                        <p className="text-xs text-muted-foreground">{error.timestamp}</p>
                      </div>
                      <Badge variant="destructive">{error.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.errors.total}</div>
                <p className="text-sm text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.errors.recent}</div>
                <p className="text-sm text-muted-foreground">Last hour</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.performance.errorRate}%</div>
                <p className="text-sm text-muted-foreground">Of total requests</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Load Times</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Average Load Time</span>
                  <span>{data.performance.averageLoadTime}s</span>
                </div>
                <div className="flex justify-between">
                  <span>95th Percentile</span>
                  <span>{data.performance.p95LoadTime}s</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.performance.uptime}%</div>
                <Progress value={data.performance.uptime} className="mt-2" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.users.activeUsers.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.users.totalSessions.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bounce Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.users.bounceRate}%</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
