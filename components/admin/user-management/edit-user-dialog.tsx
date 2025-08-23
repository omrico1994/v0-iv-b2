"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  phone?: string
  retailer_id?: string
  location_id?: string
}

interface Retailer {
  id: string
  name: string
}

interface EditUserDialogProps {
  user: User | null
  retailers: Retailer[]
  isOpen: boolean
  onClose: () => void
  onSave: (userData: Partial<User>) => Promise<void>
  isLoading?: boolean
}

export function EditUserDialog({ user, retailers, isOpen, onClose, onSave, isLoading = false }: EditUserDialogProps) {
  const [formData, setFormData] = useState<Partial<User>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        retailer_id: user.retailer_id,
        location_id: user.location_id,
      })
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error("Failed to save user:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (field: keyof User, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name || ""}
                onChange={(e) => handleChange("first_name", e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name || ""}
                onChange={(e) => handleChange("last_name", e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone || ""}
              onChange={(e) => handleChange("phone", e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role || ""}
              onValueChange={(value) => handleChange("role", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="office">Office</SelectItem>
                <SelectItem value="retailer">Retailer</SelectItem>
                <SelectItem value="location">Location</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(formData.role === "retailer" || formData.role === "location") && (
            <div>
              <Label htmlFor="retailer">Retailer</Label>
              <Select
                value={formData.retailer_id || ""}
                onValueChange={(value) => handleChange("retailer_id", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select retailer" />
                </SelectTrigger>
                <SelectContent>
                  {retailers.map((retailer) => (
                    <SelectItem key={retailer.id} value={retailer.id}>
                      {retailer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
