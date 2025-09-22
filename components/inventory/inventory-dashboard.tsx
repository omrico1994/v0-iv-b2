"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Package,
  AlertTriangle,
  TrendingDown,
  Plus,
  Search,
  Download,
  Droplets,
  Pill,
  Stethoscope,
  Syringe,
} from "lucide-react"
import type { UserWithRole } from "@/lib/auth/get-user"

interface InventoryDashboardProps {
  user: UserWithRole
}

// Mock inventory data
const mockInventoryData = [
  {
    id: "1",
    name: "Normal Saline 0.9%",
    category: "iv_fluids",
    current_stock: 45,
    minimum_stock: 50,
    maximum_stock: 200,
    unit: "bags",
    cost_per_unit: 12.5,
    supplier: "MedSupply Corp",
    expiry_date: "2024-12-15",
    location: "Storage Room A",
    status: "low_stock",
  },
  {
    id: "2",
    name: "Morphine 10mg/ml",
    category: "medications",
    current_stock: 25,
    minimum_stock: 10,
    maximum_stock: 50,
    unit: "vials",
    cost_per_unit: 45.0,
    supplier: "PharmaCorp",
    expiry_date: "2024-08-30",
    location: "Secure Cabinet B",
    status: "in_stock",
  },
  {
    id: "3",
    name: "IV Pump Model X200",
    category: "equipment",
    current_stock: 2,
    minimum_stock: 5,
    maximum_stock: 15,
    unit: "units",
    cost_per_unit: 2500.0,
    supplier: "MedTech Solutions",
    expiry_date: null,
    location: "Equipment Room",
    status: "critical_low",
  },
  {
    id: "4",
    name: "Disposable Syringes 10ml",
    category: "supplies",
    current_stock: 150,
    minimum_stock: 100,
    maximum_stock: 500,
    unit: "pieces",
    cost_per_unit: 0.75,
    supplier: "MedSupply Corp",
    expiry_date: "2025-06-20",
    location: "Supply Cabinet C",
    status: "in_stock",
  },
]

const mockStats = {
  total_items: 156,
  low_stock_items: 12,
  critical_items: 3,
  total_value: 45670.5,
}

export function InventoryDashboard({ user }: InventoryDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredInventory = mockInventoryData.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    const matchesStatus = statusFilter === "all" || item.status === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_stock":
        return "bg-green-100 text-green-800"
      case "low_stock":
        return "bg-yellow-100 text-yellow-800"
      case "critical_low":
        return "bg-red-100 text-red-800"
      case "out_of_stock":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "iv_fluids":
        return <Droplets className="w-4 h-4" />
      case "medications":
        return <Pill className="w-4 h-4" />
      case "equipment":
        return <Stethoscope className="w-4 h-4" />
      case "supplies":
        return <Syringe className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "iv_fluids":
        return "bg-blue-100 text-blue-800"
      case "medications":
        return "bg-purple-100 text-purple-800"
      case "equipment":
        return "bg-green-100 text-green-800"
      case "supplies":
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
          <h1 className="text-3xl font-semibold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Track medical supplies, medications, and equipment</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.total_items}</div>
            <p className="text-xs text-muted-foreground">In inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{mockStats.low_stock_items}</div>
            <p className="text-xs text-muted-foreground">Need reordering</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{mockStats.critical_items}</div>
            <p className="text-xs text-muted-foreground">Urgent attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockStats.total_value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Inventory worth</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="all-items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all-items">All Items</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="all-items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>Manage all medical supplies and equipment</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search inventory items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="iv_fluids">IV Fluids</SelectItem>
                    <SelectItem value="medications">Medications</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="supplies">Supplies</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="critical_low">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Inventory List */}
              <div className="space-y-4">
                {filteredInventory.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getCategoryIcon(item.category)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-600">{item.supplier}</p>
                          <p className="text-xs text-gray-500">Location: {item.location}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">
                            {item.current_stock} {item.unit}
                          </p>
                          <p className="text-xs text-gray-500">
                            Min: {item.minimum_stock} | Max: {item.maximum_stock}
                          </p>
                        </div>

                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">${item.cost_per_unit.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">per {item.unit.slice(0, -1)}</p>
                        </div>

                        <div className="flex flex-col space-y-2">
                          <Badge className={getCategoryColor(item.category)}>
                            {item.category.replace("_", " ").toUpperCase()}
                          </Badge>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>

                        <div className="flex flex-col space-y-1">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            Reorder
                          </Button>
                        </div>
                      </div>
                    </div>

                    {item.expiry_date && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-sm">
                        <span className="text-gray-500">
                          Expires: {new Date(item.expiry_date).toLocaleDateString()}
                        </span>
                        <span className="text-gray-500">
                          Total Value: ${(item.current_stock * item.cost_per_unit).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {filteredInventory.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No inventory items found matching your criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Items</CardTitle>
              <CardDescription>Items that need immediate reordering</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockInventoryData
                  .filter((item) => item.status === "low_stock" || item.status === "critical_low")
                  .map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <AlertTriangle className="w-6 h-6 text-yellow-600" />
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-600">
                              Current: {item.current_stock} {item.unit} | Minimum: {item.minimum_stock} {item.unit}
                            </p>
                          </div>
                        </div>
                        <Button>Reorder Now</Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expiring Items</CardTitle>
              <CardDescription>Items expiring within the next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockInventoryData
                  .filter((item) => item.expiry_date)
                  .map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <AlertTriangle className="w-6 h-6 text-orange-600" />
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-600">
                              Expires: {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : "N/A"}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline">Mark as Used</Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Reports</CardTitle>
              <CardDescription>Generate and download inventory reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="h-20 flex flex-col bg-transparent">
                  <Download className="w-6 h-6 mb-2" />
                  Stock Level Report
                </Button>
                <Button variant="outline" className="h-20 flex flex-col bg-transparent">
                  <Download className="w-6 h-6 mb-2" />
                  Usage Report
                </Button>
                <Button variant="outline" className="h-20 flex flex-col bg-transparent">
                  <Download className="w-6 h-6 mb-2" />
                  Expiry Report
                </Button>
                <Button variant="outline" className="h-20 flex flex-col bg-transparent">
                  <Download className="w-6 h-6 mb-2" />
                  Cost Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
