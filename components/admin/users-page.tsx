"use client"
import { useUserManagement } from "./useUserManagement" // Assuming useUserManagement is a custom hook

export function UsersPage() {
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
}
