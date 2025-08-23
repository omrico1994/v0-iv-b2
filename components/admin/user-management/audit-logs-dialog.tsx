"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

interface AuditLog {
  id: string
  action: string
  details: Record<string, any>
  performed_by: string
  performed_at: string
  performer_name?: string
}

interface AuditLogsDialogProps {
  userId: string | null
  isOpen: boolean
  onClose: () => void
}

export function AuditLogsDialog({ userId, isOpen, onClose }: AuditLogsDialogProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      loadAuditLogs()
    }
  }, [isOpen, userId])

  const loadAuditLogs = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      // This would typically call an API endpoint to fetch audit logs
      // For now, we'll show a placeholder
      setLogs([
        {
          id: "1",
          action: "user_created",
          details: { role: "retailer" },
          performed_by: "admin-user-id",
          performed_at: new Date().toISOString(),
          performer_name: "Admin User",
        },
        {
          id: "2",
          action: "user_activated",
          details: {},
          performed_by: "admin-user-id",
          performed_at: new Date(Date.now() - 86400000).toISOString(),
          performer_name: "Admin User",
        },
      ])
    } catch (error) {
      console.error("Failed to load audit logs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "user_created":
        return "default"
      case "user_activated":
        return "default"
      case "user_deactivated":
        return "secondary"
      case "user_updated":
        return "outline"
      default:
        return "outline"
    }
  }

  const formatAction = (action: string) => {
    return action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>User Audit Logs</DialogTitle>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No audit logs found for this user.</div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={getActionBadgeVariant(log.action)}>{formatAction(log.action)}</Badge>
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(log.performed_at), { addSuffix: true })}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 mb-1">Performed by: {log.performer_name || "System"}</div>

                  {Object.keys(log.details).length > 0 && (
                    <div className="text-sm text-gray-500">Details: {JSON.stringify(log.details, null, 2)}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
