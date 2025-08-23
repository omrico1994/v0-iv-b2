"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Filter } from "lucide-react"

interface Retailer {
  id: string
  name: string
  business_name: string
}

interface UserFiltersProps {
  filters: {
    role: string
    retailerId: string
    status: string
    search: string
  }
  retailers: Retailer[]
  onFilterChange: (key: string, value: string) => void
}

export function UserFilters({ filters, retailers, onFilterChange }: UserFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search Users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="search"
                placeholder="Name or email..."
                className="pl-10"
                value={filters.search}
                onChange={(e) => onFilterChange("search", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={filters.role} onValueChange={(value) => onFilterChange("role", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="office">Office</SelectItem>
                <SelectItem value="retailer">Retailer</SelectItem>
                <SelectItem value="location_user">Location User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="retailer">Retailer</Label>
            <Select value={filters.retailerId} onValueChange={(value) => onFilterChange("retailerId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All retailers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All retailers</SelectItem>
                {retailers.map((retailer) => (
                  <SelectItem key={retailer.id} value={retailer.id}>
                    {retailer.business_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={filters.status} onValueChange={(value) => onFilterChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
