"use client"

import { useState, useTransition, useCallback } from "react"
import { useCachedData } from "@/hooks/use-cached-data"
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

interface UserManagementState {
  result: { success?: string; error?: string } | null
  editingUser: UserWithDetails | null
  viewingAuditUser: UserWithDetails | null
  auditLogs: any[]
}

interface UserManagementActions {
  setResult: (result: { success?: string; error?: string } | null) => void
  setEditingUser: (user: UserWithDetails | null) => void
  setViewingAuditUser: (user: UserWithDetails | null) => void
  setAuditLogs: (logs: any[]) => void
  handleToggleStatus: (userId: string) => void
  handleResetPassword: (userId: string) => void
  handleResendInvitation: (userId: string) => void
  handleUpdateUser: (userId: string, profileData: any, roleData: any) => void
  loadAuditLogs: (userId: string) => Promise<void>
  clearResult: () => void
}

export function useUserManagement() {
  const [isPending, startTransition] = useTransition()
  const [state, setState] = useState<UserManagementState>({
    result: null,
    editingUser: null,
    viewingAuditUser: null,
    auditLogs: [],
  })

  const {
    data: allUsers = [],
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useCachedData("users", getAllUsers, {
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
  })

  const { data: retailers = [], isLoading: retailersLoading } = useCachedData("retailers", getRetailers, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  })

  const setResult = useCallback((result: { success?: string; error?: string } | null) => {
    setState((prev) => ({ ...prev, result }))
  }, [])

  const setEditingUser = useCallback((user: UserWithDetails | null) => {
    setState((prev) => ({ ...prev, editingUser: user }))
  }, [])

  const setViewingAuditUser = useCallback((user: UserWithDetails | null) => {
    setState((prev) => ({ ...prev, viewingAuditUser: user }))
  }, [])

  const setAuditLogs = useCallback((logs: any[]) => {
    setState((prev) => ({ ...prev, auditLogs: logs }))
  }, [])

  const clearResult = useCallback(() => {
    setState((prev) => ({ ...prev, result: null }))
  }, [])

  const handleToggleStatus = useCallback(
    (userId: string) => {
      startTransition(async () => {
        try {
          const result = await toggleUserStatus(userId)
          setResult(result)

          if (result.success) {
            await refetchUsers()
          }
        } catch (error) {
          setResult({ error: "An unexpected error occurred" })
        }
      })
    },
    [refetchUsers, setResult],
  )

  const handleResetPassword = useCallback(
    (userId: string) => {
      startTransition(async () => {
        try {
          const result = await resetUserPassword(userId)
          setResult(result)
        } catch (error) {
          setResult({ error: "An unexpected error occurred" })
        }
      })
    },
    [setResult],
  )

  const handleResendInvitation = useCallback(
    (userId: string) => {
      startTransition(async () => {
        try {
          const result = await resendInvitation(userId)
          setResult(result)
        } catch (error) {
          setResult({ error: "An unexpected error occurred" })
        }
      })
    },
    [setResult],
  )

  const handleUpdateUser = useCallback(
    (userId: string, profileData: any, roleData: any) => {
      startTransition(async () => {
        try {
          // Update profile
          const profileResult = await updateUserProfile(userId, profileData)

          if (!profileResult.success) {
            setResult(profileResult)
            return
          }

          // Update role if provided
          if (roleData) {
            const roleResult = await updateUserRole(userId, roleData.role, roleData.retailerId)

            if (!roleResult.success) {
              setResult(roleResult)
              return
            }
          }

          setResult({ success: "User updated successfully" })
          setEditingUser(null)
          refetchUsers()
        } catch (error) {
          setResult({ error: "An unexpected error occurred" })
        }
      })
    },
    [refetchUsers, setResult, setEditingUser],
  )

  const loadAuditLogs = useCallback(
    async (userId: string) => {
      try {
        const result = await getUserAuditLogs(userId)
        if (result.success && result.logs) {
          setAuditLogs(result.logs)
        }
      } catch (error) {
        console.error("Error loading audit logs:", error)
        setAuditLogs([])
      }
    },
    [setAuditLogs],
  )

  const actions: UserManagementActions = {
    setResult,
    setEditingUser,
    setViewingAuditUser,
    setAuditLogs,
    handleToggleStatus,
    handleResetPassword,
    handleResendInvitation,
    handleUpdateUser,
    loadAuditLogs,
    clearResult,
  }

  return {
    // Data
    allUsers,
    retailers,
    isLoading: usersLoading || retailersLoading,
    isPending,

    // State
    ...state,

    // Actions
    ...actions,
  }
}
