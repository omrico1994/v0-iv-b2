"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, Plus } from "lucide-react"
import Link from "next/link"
import { useUserManagement } from "@/hooks/use-user-management"
import { useUserFilters } from "@/hooks/use-user-filters"
import { UserFilters } from "@/components/admin/user-management/user-filters"
import { UsersTable } from "@/components/admin/user-management/users-table"
import { EditUserDialog } from "@/components/admin/user-management/edit-user-dialog"
import { AuditLogsDialog } from "@/components/admin/user-management/audit-logs-dialog"

export function UserManagementDashboard() {
  const {
    allUsers,
    retailers,
    isLoading,
    isPending,
    result,
    editingUser,
    viewingAuditUser,
    auditLogs,
    setEditingUser,
    setViewingAuditUser,
    handleToggleStatus,
    handleResetPassword,
    handleResendInvitation,
    handleUpdateUser,
    loadAuditLogs,
    clearResult,
  } = useUserManagement()

  const { filters, filteredUsers, updateFilter } = useUserFilters(allUsers)

  const openEditDialog = (user: any) => {
    setEditingUser(user)
  }

  const openAuditDialog = async (user: any) => {
    setViewingAuditUser(user)
    await loadAuditLogs(user.id)
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
          <h2 className="text-2xl font-semibold">Users ({filteredUsers.length})</h2>
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
      <UserFilters filters={filters} retailers={retailers} onFilterChange={updateFilter} />

      {/* Users Table */}
      <UsersTable
        users={filteredUsers}
        isPending={isPending}
        onEditUser={openEditDialog}
        onToggleStatus={handleToggleStatus}
        onResendInvitation={handleResendInvitation}
        onViewAudit={openAuditDialog}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        user={editingUser}
        retailers={retailers}
        isPending={isPending}
        onClose={() => setEditingUser(null)}
        onUpdateUser={handleUpdateUser}
        onResetPassword={handleResetPassword}
      />

      {/* Audit Logs Dialog */}
      <AuditLogsDialog user={viewingAuditUser} auditLogs={auditLogs} onClose={() => setViewingAuditUser(null)} />
    </div>
  )
}
