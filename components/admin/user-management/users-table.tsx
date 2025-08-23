"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Eye, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  retailer_name?: string
  location_name?: string
  invitation_status?: string
  created_at: string
}

interface UsersTableProps {
  users: User[]
  onToggleStatus: (userId: string) => void
  onEditUser: (user: User) => void
  onViewAuditLogs: (userId: string) => void
  isLoading?: boolean
}

export function UsersTable({ users, onToggleStatus, onEditUser, onViewAuditLogs, isLoading = false }: UsersTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (users.length === 0) {
    return <div className="text-center py-8 text-gray-500">No users found matching your criteria.</div>
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div key={user.id} className="border rounded-lg p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-medium">
                  {user.first_name} {user.last_name}
                </h3>
                <Badge variant={user.is_active ? "default" : "secondary"}>
                  {user.is_active ? "Active" : "Inactive"}
                </Badge>
                {user.invitation_status && <Badge variant="outline">{user.invitation_status}</Badge>}
              </div>
              <p className="text-sm text-gray-600 mb-1">{user.email}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="capitalize">{user.role}</span>
                {user.retailer_name && <span>Retailer: {user.retailer_name}</span>}
                {user.location_name && <span>Location: {user.location_name}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onToggleStatus(user.id)}>
                {user.is_active ? "Deactivate" : "Activate"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEditUser(user)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit User
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onViewAuditLogs(user.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Audit Logs
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
