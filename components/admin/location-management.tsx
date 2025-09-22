"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Plus, Search, Edit, Trash2, Building2, Users } from "lucide-react"
import type { UserWithRole } from "@/lib/auth/get-user"

interface LocationManagementProps {
  user: UserWithRole
}

// Mock location data
const mockLocationData = [
  {
    id: "1",
    name: "Main Hospital - ICU",
    address: "123 Medical Center Dr, City, State 12345",
    type: "hospital",
    capacity: 50,
    current_patients: 42,
    staff_count: 15,
    status: "active",
    manager: "Dr. Sarah Johnson",
    phone: "(555) 123-4567",
  },
  {
    id: "2",
    name: "Emergency Department",
    address: "123 Medical Center Dr, City, State 12345",
    type: "emergency",
    capacity: 25,
    current_patients: 18,
    staff_count: 12,
    status: "active",
    manager: "Dr. Mike Rodriguez",
    phone: "(555) 234-5678",
  },
  {
    id: "3",
    name: "Outpatient Clinic",
    address: "456 Healthcare Ave, City, State 12345",
    type: "clinic",
    capacity: 30,
    current_patients: 8,
    staff_count: 8,
    status: "maintenance",
    manager: "Nurse Emily Chen",
    phone: "(555) 345-6789",
  },
]

export function LocationManagement({ user }: LocationManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  const filteredLocations = mockLocationData.filter((location) => {
    const matchesSearch =
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || location.status === statusFilter
    const matchesType = typeFilter === "all" || location.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "hospital":
        return "bg-blue-100 text-blue-800"
      case "emergency":
        return "bg-red-100 text-red-800"
      case "clinic":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getUtilizationPercentage = (current: number, capacity: number) => {
    return Math.round((current / capacity) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Location Management</h1>
          <p className="text-gray-600">Manage medical facilities and treatment locations</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockLocationData.length}</div>
            <p className="text-xs text-muted-foreground">Active facilities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockLocationData.reduce((sum, loc) => sum + loc.capacity, 0)}</div>
            <p className="text-xs text-muted-foreground">Patient beds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Patients</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {mockLocationData.reduce((sum, loc) => sum + loc.current_patients, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Currently admitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
            <MapPin className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(
                (mockLocationData.reduce((sum, loc) => sum + loc.current_patients, 0) /
                  mockLocationData.reduce((sum, loc) => sum + loc.capacity, 0)) *
                  100,
              )}
              %
            </div>
            <p className="text-xs text-muted-foreground">Overall capacity</p>
          </CardContent>
        </Card>
      </div>

      {/* Location List */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Locations</CardTitle>
          <CardDescription>Manage all medical facilities and treatment centers</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search locations..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="hospital">Hospital</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="clinic">Clinic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location Cards */}
          <div className="space-y-4">
            {filteredLocations.map((location) => (
              <div key={location.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{location.name}</h3>
                      <p className="text-sm text-gray-600">{location.address}</p>
                      <p className="text-xs text-gray-500">Manager: {location.manager}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className={getTypeColor(location.type)}>{location.type.toUpperCase()}</Badge>
                        <Badge className={getStatusColor(location.status)}>{location.status.toUpperCase()}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {location.current_patients}/{location.capacity} patients
                      </p>
                      <p className="text-xs text-gray-500">
                        {getUtilizationPercentage(location.current_patients, location.capacity)}% utilization
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{location.staff_count} staff</p>
                      <p className="text-xs text-gray-500">{location.phone}</p>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Utilization Bar */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Capacity Utilization</span>
                    <span className="text-xs text-gray-500">
                      {getUtilizationPercentage(location.current_patients, location.capacity)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${getUtilizationPercentage(location.current_patients, location.capacity)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredLocations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No locations found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
