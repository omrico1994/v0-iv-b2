"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MoreHorizontal, Search, UserCheck, UserX } from "lucide-react"

interface User {
  id: string
  email: string
  fullName: string
  role: "user" | "admin" | "moderator"
  status: "active" | "inactive" | "suspended"
  lastSeen: string
  createdAt: string
}

interface UserManagementTableProps {
  users: User[]
  onUserAction: (userId: string, action: string) => void
}

export function UserManagementTable({ users, onUserAction }: UserManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const getStatusBadge = (status: User["status"]) => {
    const variants = {
      active: "bg-chart-2 text-white",
      inactive: "bg-muted text-muted-foreground",
      suspended: "bg-destructive text-destructive-foreground",
    }
    return <Badge className={variants[status]}>{status}</Badge>
  }

  const getRoleBadge = (role: User["role"]) => {
    const variants = {
      user: "bg-primary text-primary-foreground",
      admin: "bg-secondary text-secondary-foreground",
      moderator: "bg-accent text-accent-foreground",
    }
    return <Badge className={variants[role]}>{role}</Badge>
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">User Management</CardTitle>
        <CardDescription>Manage user accounts, roles, and permissions</CardDescription>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={roleFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter("all")}
            >
              All
            </Button>
            <Button
              variant={roleFilter === "user" ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter("user")}
            >
              Users
            </Button>
            <Button
              variant={roleFilter === "admin" ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter("admin")}
            >
              Admins
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.fullName}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="text-sm">{user.lastSeen}</TableCell>
                  <TableCell className="text-sm">{user.createdAt}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onUserAction(user.id, "view")}>View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUserAction(user.id, "edit")}>Edit User</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.status === "active" ? (
                          <DropdownMenuItem onClick={() => onUserAction(user.id, "suspend")}>
                            <UserX className="mr-2 h-4 w-4" />
                            Suspend User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => onUserAction(user.id, "activate")}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Activate User
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onUserAction(user.id, "reset-password")}>
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onUserAction(user.id, "delete")} className="text-destructive">
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
