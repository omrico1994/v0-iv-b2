"use client"

import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Users,
  Search,
  Filter,
  Edit,
  ToggleLeft,
  ToggleRight,
  Shield,
  Building,
  MapPin,
  User,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  Loader2,
  Plus,
  History,
  Send,
} from "lucide-react"
import {
  getAllUsers,
  updateUserProfile,
  toggleUserStatus,
  updateUserRole,
  getUserAuditLogs,
  type UserWithDetails,
} from "@/lib/actions/user-dashboard"
import { getRetailers } from "@/lib/actions/location-management"
import { resetUserPassword, resendInvitation } from "@/lib/actions/user-management"
import Link from "next/link"

interface Retailer {
  id: string
  name: string
  business_name: string
}

const roleConfig = {
  admin: { label: "Admin", icon: Shield, color: "bg-primary text-primary-foreground" },
  office: { label: "Office", icon: Building, color: "bg-secondary text-secondary-foreground" },
  retailer: { label: "Retailer", icon: User, color: "bg-accent text-accent-foreground" },
  location_user: { label: "Location User", icon: MapPin, color: "bg-muted text-muted-foreground" },
}

export function UserManagementDashboard() {
  const [users, setUsers] = useState<UserWithDetails[]>([])
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success?: string; error?: string } | null>(null)
  const [editingUser, setEditingUser] = useState<UserWithDetails | null>(null)
  const [viewingAuditUser, setViewingAuditUser] = useState<UserWithDetails | null>(null)
  const [auditLogs, setAuditLogs] = useState<any[]>([])

  // Filters
  const [filters, setFilters] = useState({
    role: "all",
    retailerId: "all",
    status: "all",
    search: "",
  })

  // Edit form data
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    role: "all",
    retailerId: "all",
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadUsers()
  }, [filters])

  const loadData = async () => {
    console.log("[v0] Loading initial data...")
    setIsLoading(true)
    try {
      const [usersResult, retailersResult] = await Promise.all([getAllUsers(), getRetailers()])

      console.log("[v0] Users result:", usersResult)
      console.log("[v0] Retailers result:", retailersResult)

      if (usersResult.success && usersResult.users) {
        console.log("[v0] Setting users:", usersResult.users.length)
        setUsers(usersResult.users)
      } else {
        console.log("[v0] Users result failed or no users:", usersResult)
      }

      if (retailersResult.success && retailersResult.retailers) {
        setRetailers(retailersResult.retailers)
      }
    } catch (error) {
      console.log("[v0] Error loading data:", error)
      setResult({ error: "Failed to load data" })
    } finally {
      setIsLoading(false)
    }
  }

  const loadUsers = async () => {
    console.log("[v0] Loading users with filters:", filters)
    try {
      const result = await getAllUsers()
      console.log("[v0] Load users result:", result)
      if (result.success && result.users) {
        console.log("[v0] Filtering users client-side, total users:", result.users.length)
        let filteredUsers = result.users

        if (filters.search) {
          filteredUsers = filteredUsers.filter(
            (user) =>
              user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
              `${user.user_profiles.first_name} ${user.user_profiles.last_name}`
                .toLowerCase()
                .includes(filters.search.toLowerCase()),
          )
        }

        if (filters.role !== "all") {
          filteredUsers = filteredUsers.filter((user) => user.user_roles[0]?.role === filters.role)
        }

        if (filters.retailerId !== "all") {
          filteredUsers = filteredUsers.filter((user) => user.user_roles[0]?.retailer_id === filters.retailerId)
        }

        if (filters.status !== "all") {
          filteredUsers = filteredUsers.filter((user) =>
            filters.status === "active" ? user.user_profiles.is_active : !user.user_profiles.is_active,
          )
        }

        console.log("[v0] Filtered users count:", filteredUsers.length)
        setUsers(filteredUsers)
      } else {
        console.log("[v0] Load users failed:", result)
      }
    } catch (error) {
      console.error("[v0] Error loading users:", error)
    }
  }

  const handleToggleStatus = (userId: string) => {
    startTransition(async () => {
      try {
        const result = await toggleUserStatus(userId)
        setResult(result)

        if (result.success) {
          await loadUsers()
        }
      } catch (error) {
        setResult({ error: "An unexpected error occurred" })
      }
    })
  }

  const handleResetPassword = (userId: string) => {
    startTransition(async () => {
      try {
        const result = await resetUserPassword(userId)
        setResult(result)
      } catch (error) {
        setResult({ error: "An unexpected error occurred" })
      }
    })
  }

  const handleResendInvitation = (userId: string) => {
    startTransition(async () => {
      try {
        const result = await resendInvitation(userId)
        setResult(result)
      } catch (error) {
        setResult({ error: "An unexpected error occurred" })
      }
    })
  }

  const openEditDialog = (user: UserWithDetails) => {
    setEditingUser(user)
    setEditFormData({
      firstName: user.user_profiles.first_name,
      lastName: user.user_profiles.last_name,
      phone: user.user_profiles.phone || "",
      role: user.user_roles[0]?.role || "all",
      retailerId: user.user_roles[0]?.retailer_id || "all",
    })
  }

  const handleUpdateUser = () => {
    if (!editingUser) return

    startTransition(async () => {
      try {
        // Update profile
        const profileResult = await updateUserProfile(editingUser.id, {
          firstName: editFormData.firstName,
          lastName: editFormData.lastName,
          phone: editFormData.phone,
        })

        if (!profileResult.success) {
          setResult(profileResult)
          return
        }

        // Update role if changed
        const currentRole = editingUser.user_roles[0]
        if (editFormData.role !== currentRole?.role || editFormData.retailerId !== currentRole?.retailer_id) {
          const roleResult = await updateUserRole(editingUser.id, editFormData.role, editFormData.retailerId)

          if (!roleResult.success) {
            setResult(roleResult)
            return
          }
        }

        setResult({ success: "User updated successfully" })
        setEditingUser(null)
        loadUsers()
      } catch (error) {
        setResult({ error: "An unexpected error occurred" })
      }
    })
  }

  const openAuditDialog = async (user: UserWithDetails) => {
    setViewingAuditUser(user)
    try {
      const result = await getUserAuditLogs(user.id)
      if (result.success && result.logs) {
        setAuditLogs(result.logs)
      }
    } catch (error) {
      console.error("Error loading audit logs:", error)
    }
  }

  const getRoleDisplay = (user: UserWithDetails) => {
    const role = user.user_roles[0]
    if (!role) return { label: "No Role", icon: User, color: "bg-muted text-muted-foreground" }
    return roleConfig[role.role as keyof typeof roleConfig] || roleConfig.location_user
  }

  const getLocationCount = (user: UserWithDetails) => {
    return user.user_location_memberships.filter((m) => m.is_active).length
  }

  const getInvitationStatus = (user: UserWithDetails) => {
    const invitation = user.user_invitations[0]
    if (!invitation) return "Completed"
    return invitation.status === "accepted" ? "Completed" : invitation.status
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
          <h2 className="text-2xl font-semibold">Users ({users.length})</h2>
          <p className="text-muted-foreground">Manage all users across the system</p>
        </div>

        <Link href="/dashboard/admin/users/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </Link>
      </div>

      {/* Filters */}
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
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={filters.role} onValueChange={(value) => setFilters((prev) => ({ ...prev, role: value }))}>
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
              <Select
                value={filters.retailerId}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, retailerId: value }))}
              >
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
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              >
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

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            All Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Retailer</TableHead>
                <TableHead>Locations</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invitation</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const roleDisplay = getRoleDisplay(user)
                const RoleIcon = roleDisplay.icon
                const retailer = user.user_roles[0]?.retailers
                const locationCount = getLocationCount(user)
                const invitationStatus = getInvitationStatus(user)

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span className="font-medium">
                            {user.user_profiles.first_name} {user.user_profiles.last_name}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="w-3 h-3 mr-1" />
                          {user.email}
                        </div>
                        {user.user_profiles.phone && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="w-3 h-3 mr-1" />
                            {user.user_profiles.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className={`p-1 rounded ${roleDisplay.color} mr-2`}>
                          <RoleIcon className="w-3 h-3" />
                        </div>
                        {roleDisplay.label}
                      </div>
                    </TableCell>
                    <TableCell>
                      {retailer ? (
                        <div className="flex items-center">
                          <Building className="w-4 h-4 mr-1 text-muted-foreground" />
                          {retailer.business_name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {locationCount > 0 ? (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-muted-foreground" />
                          {locationCount}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.user_profiles.is_active ? "default" : "secondary"}>
                        {user.user_profiles.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invitationStatus === "Completed"
                            ? "default"
                            : invitationStatus === "sent"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {invitationStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(user.id)}
                          disabled={isPending}
                        >
                          {user.user_profiles.is_active ? (
                            <ToggleRight className="w-4 h-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                        {invitationStatus !== "Completed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResendInvitation(user.id)}
                            disabled={isPending}
                            title="Resend invitation"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => openAuditDialog(user)}>
                          <History className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {users.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No users found matching your filters.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details and role assignments.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editFirstName">First Name *</Label>
              <Input
                id="editFirstName"
                value={editFormData.firstName}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, firstName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editLastName">Last Name *</Label>
              <Input
                id="editLastName"
                value={editFormData.lastName}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, lastName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editPhone">Phone Number</Label>
              <Input
                id="editPhone"
                type="tel"
                value={editFormData.phone}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editRole">Role *</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value) => setEditFormData((prev) => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select role</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="retailer">Retailer</SelectItem>
                  <SelectItem value="location_user">Location User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(editFormData.role === "retailer" || editFormData.role === "location_user") && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="editRetailer">Retailer</Label>
                <Select
                  value={editFormData.retailerId}
                  onValueChange={(value) => setEditFormData((prev) => ({ ...prev, retailerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select retailer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select retailer</SelectItem>
                    {retailers.map((retailer) => (
                      <SelectItem key={retailer.id} value={retailer.id}>
                        {retailer.business_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => editingUser && handleResetPassword(editingUser.id)}
              disabled={isPending}
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reset Password
            </Button>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateUser}
                disabled={isPending || !editFormData.firstName || !editFormData.lastName || !editFormData.role}
              >
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Audit Logs Dialog */}
      <Dialog open={!!viewingAuditUser} onOpenChange={(open) => !open && setViewingAuditUser(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Activity Log</DialogTitle>
            <DialogDescription>
              Recent activity and changes for {viewingAuditUser?.user_profiles.first_name}{" "}
              {viewingAuditUser?.user_profiles.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {auditLogs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="text-sm font-medium">{log.action}</span>
                    <Badge variant="outline" className="ml-2">
                      {log.table_name}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                {log.user_profiles && (
                  <p className="text-sm text-muted-foreground">
                    By: {log.user_profiles.first_name} {log.user_profiles.last_name}
                  </p>
                )}
                {log.new_data && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Changes:</p>
                    <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(log.new_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}

            {auditLogs.length === 0 && (
              <div className="text-center py-8">
                <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No activity logs found for this user.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
