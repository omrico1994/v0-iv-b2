"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  Download,
  Calendar,
  FileText,
  AlertTriangle,
  Clock,
} from "lucide-react"
import type { UserWithRole } from "@/lib/auth/get-user"
import { addDays } from "date-fns"
import type { DateRange } from "react-day-picker"

interface ReportsDashboardProps {
  user: UserWithRole
}

// Mock data for charts
const patientVolumeData = [
  { month: "Jan", patients: 145, sessions: 320 },
  { month: "Feb", patients: 162, sessions: 380 },
  { month: "Mar", patients: 178, sessions: 420 },
  { month: "Apr", patients: 195, sessions: 465 },
  { month: "May", patients: 210, sessions: 510 },
  { month: "Jun", patients: 225, sessions: 545 },
]

const treatmentTypeData = [
  { name: "Hydration Therapy", value: 35, color: "#3b82f6" },
  { name: "Vitamin Infusions", value: 28, color: "#10b981" },
  { name: "Medication Delivery", value: 22, color: "#f59e0b" },
  { name: "Blood Transfusion", value: 15, color: "#ef4444" },
]

const staffUtilizationData = [
  { name: "Dr. Johnson", hours: 42, efficiency: 95 },
  { name: "Nurse Chen", hours: 38, efficiency: 92 },
  { name: "Dr. Smith", hours: 40, efficiency: 88 },
  { name: "Nurse Rodriguez", hours: 36, efficiency: 90 },
  { name: "Tech Wilson", hours: 35, efficiency: 85 },
]

const mockStats = {
  total_patients: 1247,
  total_sessions: 3456,
  avg_session_duration: 2.5,
  success_rate: 98.5,
  monthly_growth: 12.3,
  staff_utilization: 87.2,
}

export function ReportsDashboard({ user }: ReportsDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  })
  const [reportType, setReportType] = useState("overview")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into IV therapy operations</p>
        </div>
        <div className="flex space-x-2">
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.total_patients.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{mockStats.monthly_growth}%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IV Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.total_sessions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.avg_session_duration}h</div>
            <p className="text-xs text-muted-foreground">Per session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{mockStats.success_rate}%</div>
            <p className="text-xs text-muted-foreground">Treatment completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Reports */}
      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="operational">Operational</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Patient Volume Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Patient Volume Trends</CardTitle>
                <CardDescription>Monthly patient count and session volume</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={patientVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="patients" fill="#3b82f6" name="Patients" />
                    <Bar dataKey="sessions" fill="#10b981" name="Sessions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Treatment Types */}
            <Card>
              <CardHeader>
                <CardTitle>Treatment Distribution</CardTitle>
                <CardDescription>Breakdown by treatment type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={treatmentTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {treatmentTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Staff Utilization */}
          <Card>
            <CardHeader>
              <CardTitle>Staff Utilization</CardTitle>
              <CardDescription>Weekly hours and efficiency metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={staffUtilizationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#3b82f6" name="Hours Worked" />
                  <Bar dataKey="efficiency" fill="#10b981" name="Efficiency %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operational" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Equipment Utilization</CardTitle>
                <CardDescription>Usage statistics for IV equipment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">IV Pumps</span>
                    <span className="text-sm text-gray-600">85% utilization</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: "85%" }}></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Monitors</span>
                    <span className="text-sm text-gray-600">92% utilization</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: "92%" }}></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Beds</span>
                    <span className="text-sm text-gray-600">78% utilization</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: "78%" }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory Status</CardTitle>
                <CardDescription>Current stock levels and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Normal Saline</span>
                    </div>
                    <span className="text-sm text-green-700">In Stock</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium">IV Tubing</span>
                    </div>
                    <span className="text-sm text-yellow-700">Low Stock</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium">Morphine</span>
                    </div>
                    <span className="text-sm text-red-700">Critical</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$125,430</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+8.2%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cost per Session</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$36.25</div>
                <p className="text-xs text-muted-foreground">Average treatment cost</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">24.8%</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Revenue by treatment type and department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {treatmentTypeData.map((treatment, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: treatment.color }}></div>
                      <span className="text-sm font-medium">{treatment.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">${(treatment.value * 1000).toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{treatment.value}% of total</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
                <CardDescription>Patient safety and treatment outcomes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Treatment Success Rate</span>
                    <span className="text-sm font-bold text-green-600">98.5%</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Patient Satisfaction</span>
                    <span className="text-sm font-bold text-blue-600">4.8/5.0</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Adverse Events</span>
                    <span className="text-sm font-bold text-yellow-600">0.2%</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Readmission Rate</span>
                    <span className="text-sm font-bold text-green-600">1.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Incident Reports</CardTitle>
                <CardDescription>Safety incidents and follow-up actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm">Minor infiltration - Room 205</span>
                    </div>
                    <span className="text-xs text-gray-500">2 hours ago</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Equipment maintenance completed</span>
                    </div>
                    <span className="text-xs text-gray-500">1 day ago</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Staff training session completed</span>
                    </div>
                    <span className="text-xs text-gray-500">3 days ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Report Actions</CardTitle>
          <CardDescription>Generate and download specific reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex flex-col bg-transparent">
              <FileText className="w-6 h-6 mb-2" />
              Patient Summary
            </Button>
            <Button variant="outline" className="h-20 flex flex-col bg-transparent">
              <BarChart3 className="w-6 h-6 mb-2" />
              Usage Analytics
            </Button>
            <Button variant="outline" className="h-20 flex flex-col bg-transparent">
              <Users className="w-6 h-6 mb-2" />
              Staff Performance
            </Button>
            <Button variant="outline" className="h-20 flex flex-col bg-transparent">
              <Calendar className="w-6 h-6 mb-2" />
              Monthly Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
