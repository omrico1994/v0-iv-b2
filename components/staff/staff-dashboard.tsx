"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, UserCheck, Clock, AlertTriangle, Plus, Search, Calendar, Activity } from "lucide-react"
import type { UserWithRole } from "@/lib/auth/get-user"

interface StaffDashboardProps {
  user: UserWithRole
}

// Mock data for demonstration
const mockStaffData = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    role: "doctor",
    department: "Emergency Medicine",
    status: "on_duty",
    shift: "Day Shift (7AM-7PM)",
    patients_assigned: 8,
    license_number: "MD123456",
    phone: "(555) 123-4567",
    last_activity: "2 minutes ago",
  },
  {
    id: "2",
    name: "Nurse Emily Chen",
    role: "nurse",
    department: "ICU",
    status: "on_duty",
    shift: "Night Shift (7PM-7AM)",
    patients_assigned: 12,
    license_number: "RN789012",
    phone: "(555) 234-5678",
    last_activity: "5 minutes ago",
  },
  {
    id: "3",
    name: "Tech Mike Rodriguez",
    role: "technician",
    department: "Equipment Services",
    status: "off_duty",
    shift: "Day Shift (8AM-4PM)",
    patients_assigned: 0,
    license_number: "CT345678",
    phone: "(555) 345-6789",
    last_activity: "2 hours ago",
  },
]

const mockStats = {
  total_staff: 45,
  on_duty: 28,
  off_duty: 17,
  alerts: 3,
}

export function StaffDashboard({ user }: StaffDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")

  const filteredStaff = mockStaffData.filter((staff) => {
    const matchesSearch =
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.department.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || staff.status === statusFilter
    const matchesRole = roleFilter === "all" || staff.role === roleFilter

    return matchesSearch && matchesStatus && matchesRole
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on_duty":
        return "bg-green-100 text-green-800"
      case "off_duty":
        return "bg-gray-100 text-gray-800"
      case "break":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "doctor":
        return "bg-blue-100 text-blue-800"
      case "nurse":
        return "bg-purple-100 text-purple-800"
      case "technician":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Staff Management</h1>
          <p className="text-gray-600">Monitor and manage medical staff across all departments</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.total_staff}</div>
            <p className="text-xs text-muted-foreground">Active medical staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Duty</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{mockStats.on_duty}</div>
            <p className="text-xs text-muted-foreground">Currently working</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Off Duty</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{mockStats.off_duty}</div>
            <p className="text-xs text-muted-foreground">Not scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{mockStats.alerts}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Directory</CardTitle>
          <CardDescription>Search and filter medical staff members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="on_duty">On Duty</SelectItem>
                <SelectItem value="off_duty">Off Duty</SelectItem>
                <SelectItem value="break">On Break</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="doctor">Doctors</SelectItem>
                <SelectItem value="nurse">Nurses</SelectItem>
                <SelectItem value="technician">Technicians</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Staff List */}
          <div className="space-y-4">
            {filteredStaff.map((staff) => (
              <div key={staff.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{staff.name}</h3>
                      <p className="text-sm text-gray-600">{staff.department}</p>
                      <p className="text-xs text-gray-500">License: {staff.license_number}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className={getRoleColor(staff.role)}>{staff.role.replace("_", " ").toUpperCase()}</Badge>
                        <Badge className={getStatusColor(staff.status)}>
                          {staff.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{staff.shift}</p>
                      <p className="text-xs text-gray-500">{staff.patients_assigned} patients assigned</p>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <Button variant="outline" size="sm">
                        <Calendar className="w-4 h-4 mr-1" />
                        Schedule
                      </Button>
                      <Button variant="outline" size="sm">
                        <Activity className="w-4 h-4 mr-1" />
                        Activity
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                  <span>Phone: {staff.phone}</span>
                  <span>Last activity: {staff.last_activity}</span>
                </div>
              </div>
            ))}
          </div>

          {filteredStaff.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No staff members found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
