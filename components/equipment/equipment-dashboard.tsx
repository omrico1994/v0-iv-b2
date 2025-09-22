"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Stethoscope, Settings, AlertTriangle, CheckCircle, Plus, Search, Calendar, Wrench } from "lucide-react"
import type { UserWithRole } from "@/lib/auth/get-user"

interface EquipmentDashboardProps {
  user: UserWithRole
}

// Mock equipment data
const mockEquipmentData = [
  {
    id: "1",
    name: "IV Pump Model X200",
    serial_number: "IVP-2024-001",
    category: "infusion_pumps",
    status: "operational",
    location: "ICU Room 101",
    last_maintenance: "2024-01-10",
    next_maintenance: "2024-04-10",
    assigned_to: "Nurse Emily Chen",
    purchase_date: "2023-06-15",
    warranty_expires: "2026-06-15",
  },
  {
    id: "2",
    name: "Patient Monitor PM-500",
    serial_number: "PM-2024-002",
    category: "monitoring",
    status: "maintenance_required",
    location: "Emergency Room",
    last_maintenance: "2023-12-15",
    next_maintenance: "2024-01-15",
    assigned_to: "Dr. Sarah Johnson",
    purchase_date: "2023-03-20",
    warranty_expires: "2026-03-20",
  },
  {
    id: "3",
    name: "Defibrillator AED-300",
    serial_number: "AED-2024-003",
    category: "emergency",
    status: "out_of_service",
    location: "Maintenance Room",
    last_maintenance: "2024-01-05",
    next_maintenance: "2024-02-05",
    assigned_to: null,
    purchase_date: "2023-09-10",
    warranty_expires: "2026-09-10",
  },
]

const mockStats = {
  total_equipment: 45,
  operational: 38,
  maintenance_required: 5,
  out_of_service: 2,
}

export function EquipmentDashboard({ user }: EquipmentDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const filteredEquipment = mockEquipmentData.filter((equipment) => {
    const matchesSearch =
      equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || equipment.status === statusFilter
    const matchesCategory = categoryFilter === "all" || equipment.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-green-100 text-green-800"
      case "maintenance_required":
        return "bg-yellow-100 text-yellow-800"
      case "out_of_service":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="w-4 h-4" />
      case "maintenance_required":
        return <Settings className="w-4 h-4" />
      case "out_of_service":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Stethoscope className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Equipment Management</h1>
          <p className="text-gray-600">Monitor and maintain medical equipment</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Equipment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.total_equipment}</div>
            <p className="text-xs text-muted-foreground">Registered devices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operational</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{mockStats.operational}</div>
            <p className="text-xs text-muted-foreground">Ready for use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Settings className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{mockStats.maintenance_required}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Service</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{mockStats.out_of_service}</div>
            <p className="text-xs text-muted-foreground">Not available</p>
          </CardContent>
        </Card>
      </div>

      {/* Equipment List */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment Inventory</CardTitle>
          <CardDescription>Track and manage all medical equipment</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search equipment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="maintenance_required">Maintenance Required</SelectItem>
                <SelectItem value="out_of_service">Out of Service</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="infusion_pumps">Infusion Pumps</SelectItem>
                <SelectItem value="monitoring">Monitoring</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Equipment Cards */}
          <div className="space-y-4">
            {filteredEquipment.map((equipment) => (
              <div key={equipment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Stethoscope className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{equipment.name}</h3>
                      <p className="text-sm text-gray-600">Serial: {equipment.serial_number}</p>
                      <p className="text-xs text-gray-500">Location: {equipment.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <Badge className={getStatusColor(equipment.status)}>
                        <span className="flex items-center space-x-1">
                          {getStatusIcon(equipment.status)}
                          <span>{equipment.status.replace("_", " ").toUpperCase()}</span>
                        </span>
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {equipment.assigned_to ? `Assigned to ${equipment.assigned_to}` : "Unassigned"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        Next Maintenance: {new Date(equipment.next_maintenance).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Warranty: {new Date(equipment.warranty_expires).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <Button variant="outline" size="sm">
                        <Calendar className="w-4 h-4 mr-1" />
                        Schedule
                      </Button>
                      <Button variant="outline" size="sm">
                        <Wrench className="w-4 h-4 mr-1" />
                        Maintain
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredEquipment.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Stethoscope className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No equipment found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
