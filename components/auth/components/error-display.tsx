"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, ExternalLink } from "lucide-react"

interface RecoveryAction {
  label: string
  action: string
  primary?: boolean
}

interface ErrorDisplayProps {
  error: string
  recoveryActions: RecoveryAction[]
  onRecoveryAction: (action: string) => void
}

export function ErrorDisplay({ error, recoveryActions, onRecoveryAction }: ErrorDisplayProps) {
  if (!error) return null

  return (
    <div className="space-y-3">
      <Alert className="border-destructive bg-destructive/10">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-destructive">{error}</AlertDescription>
      </Alert>

      {recoveryActions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {recoveryActions.map((action, index) => (
            <Button
              key={index}
              type="button"
              variant={action.primary ? "default" : "outline"}
              size="sm"
              onClick={() => onRecoveryAction(action.action)}
              className="text-xs"
            >
              {action.action === "retry" && <RefreshCw className="w-3 h-3 mr-1" />}
              {(action.action === "contact_support" || action.action === "contact_admin") && (
                <ExternalLink className="w-3 h-3 mr-1" />
              )}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
