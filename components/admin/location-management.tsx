"use client"

import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MapPin, Plus, Edit, Users, Phone, Building, AlertCircle, Loader2, ToggleLeft, ToggleRight } from "lucide-react"
import {
  getLocationsWithRetailers,
  getRetailers,
  createLocation,
  updateLocation,
  toggleLocationStatus,
  type LocationData,
} from "@/lib/actions/location-management"

interface Location {
  id: string
  name: string
  full_address: string
  phone?: string
  timezone: string
  is_active: boolean
  operating_hours?: any
  created_at: string
  retailers: {
    id: string
    name: string
    business_name: string
  }
  user_location_memberships: Array<{
    user_id: string
    is_active: boolean
    user_profiles: {
      first_name: string
      last_name: string
      user_roles: Array<{
        role: string
      }>
    }
  }>
}

interface Retailer {
  id: string
  name: string
  business_name: string
}

export function LocationManagement() {
  const [locations, setLocations] = useState<Location[]>([])
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success?: string; error?: string } | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)

  const [formData, setFormData] = useState<LocationData>({
    name: "",
    retailerId: "",
    fullAddress: "",
    phone: "",
    timezone: "America/New_York",
    operatingHours: {
      monday: { open: "09:00", close: "17:00" },
      tuesday: { open: "09:00", close: "17:00" },
      wednesday: { open: "09:00", close: "17:00" },
      thursday: { open: "09:00", close: "17:00" },
      friday: { open: "09:00", close: "17:00" },
      saturday: { closed: true },
      sunday: { closed: true },
    },
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [locationsResult, retailersResult] = await Promise.all([getLocationsWithRetailers(), getRetailers()])

      if (locationsResult.success && locationsResult.locations) {
        setLocations(locationsResult.locations)
      }

      if (retailersResult.success && retailersResult.retailers) {
        setRetailers(retailersResult.retailers)
      }
    } catch (error) {
      setResult({ error: "Failed to load data" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateLocation = () => {
    startTransition(async () => {
      try {
        const result = await createLocation(formData)
        setResult(result)

        if (result.success) {
          setIsCreateDialogOpen(false)
          setFormData({
            name: "",
            retailerId: "",
            fullAddress: "",
            phone: "",
            timezone: "America/New_York",
            operatingHours: {
              monday: { open: "09:00", close: "17:00" },
              tuesday: { open: "09:00", close: "17:00" },
              wednesday: { open: "09:00", close: "17:00" },
              thursday: { open: "09:00", close: "17:00" },
              friday: { open: "09:00", close: "17:00" },
              saturday: { closed: true },
              sunday: { closed: true },
            },
          })
          loadData()
        }
      } catch (error) {
        setResult({ error: "An unexpected error occurred" })
      }
    })
  }

  const handleUpdateLocation = () => {
    if (!editingLocation) return

    startTransition(async () => {
      try {
        const result = await updateLocation(editingLocation.id, formData)
        setResult(result)

        if (result.success) {
          setEditingLocation(null)
          loadData()
        }
      } catch (error) {
        setResult({ error: "An unexpected error occurred" })
      }
    })
  }

  const handleToggleStatus = (locationId: string) => {
    startTransition(async () => {
      try {
        const result = await toggleLocationStatus(locationId)
        setResult(result)

        if (result.success) {
          loadData()
        }
      } catch (error) {
        setResult({ error: "An unexpected error occurred" })
      }
    })
  }

  const openEditDialog = (location: Location) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      retailerId: location.retailers.id,
      fullAddress: location.full_address,
      phone: location.phone || "",
      timezone: location.timezone,
      operatingHours: location.operating_hours || {
        monday: { open: "09:00", close: "17:00" },
        tuesday: { open: "09:00", close: "17:00" },
        wednesday: { open: "09:00", close: "17:00" },
        thursday: { open: "09:00", close: "17:00" },
        friday: { open: "09:00", close: "17:00" },
        saturday: { closed: true },
        sunday: { closed: true },
      },
    })
  }

  const resetForm = () => {
    setFormData({
      name: "",
      retailerId: "",
      fullAddress: "",
      phone: "",
      timezone: "America/New_York",
      operatingHours: {
        monday: { open: "09:00", close: "17:00" },
        tuesday: { open: "09:00", close: "17:00" },
        wednesday: { open: "09:00", close: "17:00" },
        thursday: { open: "09:00", close: "17:00" },
        friday: { open: "09:00", close: "17:00" },
        saturday: { closed: true },
        sunday: { closed: true },
      },
    })
    setEditingLocation(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Result Alert */}
      {result && (
        <Alert className={result.success ? "border-green-200 bg-green-50" : "border-destructive bg-destructive/10"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className={result.success ? "text-green-800" : "text-destructive"}>
            {result.success || result.error}
          </AlertDescription>
        </Alert>
      )}

      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Locations ({locations.length})</h2>
          <p className="text-muted-foreground">Manage locations across all retailers</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Location</DialogTitle>
              <DialogDescription>Add a new location to a retailer business.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Location Name *</Label>
                <Input
                  id="name"
                  placeholder="Downtown Store"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retailer">Retailer *</Label>
                <Select
                  value={formData.retailerId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, retailerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select retailer" />
                  </SelectTrigger>
                  <SelectContent>
                    {retailers.map((retailer) => (
                      <SelectItem key={retailer.id} value={retailer.id}>
                        {retailer.business_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Full Address *</Label>
                <Input
                  id="address"
                  placeholder="123 Main St, City, State 12345"
                  value={formData.fullAddress}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fullAddress: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone *</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, timezone: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateLocation}
                disabled={isPending || !formData.name || !formData.retailerId || !formData.fullAddress}
              >
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Location
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Locations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            All Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Retailer</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{location.name}</p>
                      <p className="text-sm text-muted-foreground">{location.timezone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Building className="w-4 h-4 mr-2 text-muted-foreground" />
                      {location.retailers.business_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{location.full_address}</p>
                  </TableCell>
                  <TableCell>
                    {location.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="w-4 h-4 mr-1 text-muted-foreground" />
                        {location.phone}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1 text-muted-foreground" />
                      {location.user_location_memberships.filter((m) => m.is_active).length}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={location.is_active ? "default" : "secondary"}>
                      {location.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(location)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(location.id)}
                        disabled={isPending}
                      >
                        {location.is_active ? (
                          <ToggleRight className="w-4 h-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {locations.length === 0 && (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No locations found. Create your first location to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Location Dialog */}
      <Dialog open={!!editingLocation} onOpenChange={(open) => !open && setEditingLocation(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>Update location details and settings.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Location Name *</Label>
              <Input
                id="editName"
                placeholder="Downtown Store"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editRetailer">Retailer *</Label>
              <Select
                value={formData.retailerId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, retailerId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select retailer" />
                </SelectTrigger>
                <SelectContent>
                  {retailers.map((retailer) => (
                    <SelectItem key={retailer.id} value={retailer.id}>
                      {retailer.business_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="editAddress">Full Address *</Label>
              <Input
                id="editAddress"
                placeholder="123 Main St, City, State 12345"
                value={formData.fullAddress}
                onChange={(e) => setFormData((prev) => ({ ...prev, fullAddress: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editPhone">Phone Number</Label>
              <Input
                id="editPhone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editTimezone">Timezone *</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setEditingLocation(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateLocation}
              disabled={isPending || !formData.name || !formData.retailerId || !formData.fullAddress}
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Location
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
