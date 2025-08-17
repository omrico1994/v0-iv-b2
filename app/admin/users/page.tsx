"use client"

import { useState, useEffect } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { UserManagementTable } from "@/components/admin/user-management-table"
import { createClient } from "@/lib/supabase/client"

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("user_profiles").select("*").order("created_at", { ascending: false })

    if (data) {
      const formattedUsers = data.map((user) => ({
        id: user.id,
        email: user.email,
        fullName: user.full_name || user.email,
        role: user.role || "user",
        status: user.is_active ? "active" : "inactive",
        lastSeen: user.last_seen_at ? new Date(user.last_seen_at).toLocaleDateString() : "Never",
        createdAt: new Date(user.created_at).toLocaleDateString(),
      }))
      setUsers(formattedUsers)
    }
    setLoading(false)
  }

  const handleUserAction = async (userId: string, action: string) => {
    console.log(`Action ${action} for user ${userId}`)
    // Implement user actions here
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 lg:pl-64">
        <div className="flex h-14 items-center justify-between border-b px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <AdminSidebar className="lg:hidden" />
            <h1 className="text-lg font-semibold">User Management</h1>
          </div>
        </div>
        <main className="flex-1 space-y-6 p-4 lg:p-6">
          <UserManagementTable users={users} onUserAction={handleUserAction} />
        </main>
      </div>
    </div>
  )
}
