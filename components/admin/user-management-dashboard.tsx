"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, UserCheck, UserX, Shield, Plus, Search, Edit, Mail, Phone, Calendar } from "lucide-react"
import type { UserWithRole } from "@/lib/auth/get-user"

interface UserManagementDashboardProps {
  user: UserWithRole
}

// Mock user data
const mockUserData = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@hospital.com",
    role: "doctor",
    department: "Emergency Medicine",
    status: "active",
    last_login: "2024-01-15T10:30:00Z",
    created_at: "2023-06-15T09:00:00Z",
    phone: "(555) 123-4567",
    license_number: "MD123456",
    permissions: ["patient_read", "patient_write", "iv_monitor"],
  },
  {
    id: "2",
    name: "Nurse Emily Chen",
    email: "emily.chen@hospital.com",
    role: "nurse",
    department: "ICU",
    status: "active",
    last_login: "2024-01-15T08:15:00Z",
    created_at: "2023-03-20T14:30:00Z",
    phone: "(555) 234-5678",
    license_number: "RN789012",
    permissions: ["patient_read", "patient_write", "iv_monitor", "medication_admin"],
  },
  {
    id: "3",
    name: "Tech Mike Rodriguez",
    email: "mike.rodriguez@hospital.com",
    role: "technician",
    department: "Equipment Services",
    status: "inactive",
    last_login: "2024-01-10T16:45:00Z",
    created_at: "2023-09-10T11:00:00Z",
    phone: "(555) 345-6789",
    license_number: "CT345678",
    permissions: ["equipment_read", "equipment_write"],
  },
  {
    id: "4",
    name: "Dr. Michael Smith",
    email: "michael.smith@hospital.com",
    role: "medical_director",
    department: "Administration",
    status: "active",
    last_login: "2024-01-15T07:00:00Z",
    created_at: "2023-01-15T10:00:00Z",
    phone: "(555) 456-7890",
    license_number: "MD567890",
    permissions: ["all_access"],
  },
]

const mockStats = {
  total_users: 45,
  active_users: 38,
  inactive_users: 7,
  pending_approvals: 3,
}

export function UserManagementDashboard({ user }: UserManagementDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")

  const filteredUsers = mockUserData.filter((userData) => {
    const matchesSearch =
      userData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userData.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || userData.role === roleFilter
    const matchesStatus = statusFilter === "all" || userData.status === statusFilter
    const matchesDepartment = departmentFilter === "all" || userData.department === departmentFilter

    return matchesSearch && matchesRole && matchesStatus && matchesDepartment
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "system_admin":
        return "bg-purple-100 text-purple-800"
      case "medical_director":
        return "bg-blue-100 text-blue-800"
      case "doctor":
        return "bg-green-100 text-green-800"
      case "nurse":
        return "bg-orange-100 text-orange-800"
      case "technician":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 24) {
      return `${diffInHours} hours ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} days ago`
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users, roles, and permissions</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.total_users}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{mockStats.active_users}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{mockStats.inactive_users}</div>
            <p className="text-xs text-muted-foreground">Deactivated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Shield className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{mockStats.pending_approvals}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Users</CardTitle>
              <CardDescription>Manage all registered users and their access</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="system_admin">System Admin</SelectItem>
                    <SelectItem value="medical_director">Medical Director</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="nurse">Nurse</SelectItem>
                    <SelectItem value="technician">Technician</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* User List */}
              <div className="space-y-4">
                {filteredUsers.map((userData) => (
                  <div key={userData.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{userData.name}</h3>
                          <p className="text-sm text-gray-600">{userData.email}</p>
                          <p className="text-xs text-gray-500">
                            {userData.department} • License: {userData.license_number}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge className={getRoleColor(userData.role)}>
                              {userData.role.replace("_", " ").toUpperCase()}
                            </Badge>
                            <Badge className={getStatusColor(userData.status)}>{userData.status.toUpperCase()}</Badge>
                          </div>
                          <p className="text-xs text-gray-500">Last login: {formatLastLogin(userData.last_login)}</p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-gray-600 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {userData.phone}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Joined {formatDate(userData.created_at)}
                          </p>
                        </div>

                        <div className="flex flex-col space-y-1">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            <Mail className="w-4 h-4 mr-1" />
                            Contact
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Permissions */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {userData.permissions.slice(0, 3).map((permission, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {permission.replace("_", " ")}
                            </Badge>
                          ))}
                          {userData.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{userData.permissions.length - 3} more
                            </Badge>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          <Shield className="w-4 h-4 mr-1" />
                          Manage Permissions
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No users found matching your criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>Configure user roles and their associated permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">System Administrator</h3>
                    <p className="text-sm text-gray-600 mb-3">Full system access and management</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge className="bg-purple-100 text-purple-800">All Access</Badge>
                      <Badge className="bg-purple-100 text-purple-800">User Management</Badge>
                      <Badge className="bg-purple-100 text-purple-800">System Settings</Badge>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Medical Director</h3>
                    <p className="text-sm text-gray-600 mb-3">Department oversight and management</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge className="bg-blue-100 text-blue-800">Staff Management</Badge>
                      <Badge className="bg-blue-100 text-blue-800">Patient Access</Badge>
                      <Badge className="bg-blue-100 text-blue-800">Reports</Badge>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Doctor</h3>
                    <p className="text-sm text-gray-600 mb-3">Patient care and treatment management</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge className="bg-green-100 text-green-800">Patient Read/Write</Badge>
                      <Badge className="bg-green-100 text-green-800">IV Monitoring</Badge>
                      <Badge className="bg-green-100 text-green-800">Prescriptions</Badge>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Nurse</h3>
                    <p className="text-sm text-gray-600 mb-3">Patient care and medication administration</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge className="bg-orange-100 text-orange-800">Patient Care</Badge>
                      <Badge className="bg-orange-100 text-orange-800">Medication Admin</Badge>
                      <Badge className="bg-orange-100 text-orange-800">IV Monitoring</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Activity Log</CardTitle>
              <CardDescription>Recent user actions and system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Dr. Sarah Johnson logged in</span>
                  </div>
                  <span className="text-xs text-gray-500">2 minutes ago</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">New user Emily Chen created</span>
                  </div>
                  <span className="text-xs text-gray-500">1 hour ago</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Mike Rodriguez permissions updated</span>
                  </div>
                  <span className="text-xs text-gray-500">3 hours ago</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Failed login attempt for admin@hospital.com</span>
                  </div>
                  <span className="text-xs text-gray-500">5 hours ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
