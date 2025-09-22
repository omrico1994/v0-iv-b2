"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface PasswordFormProps {
  userEmail?: string | null
  isInvitationFlow: boolean
  isPasswordReset: boolean
  isPending: boolean
  onSubmit: (password: string, confirmPassword: string) => void
}

export function PasswordForm({ userEmail, isInvitationFlow, isPasswordReset, isPending, onSubmit }: PasswordFormProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(password, confirmPassword)
  }

  const getTitle = () => {
    if (isInvitationFlow) return "Set Your Password"
    if (isPasswordReset) return "Reset Your Password"
    return "Set Your Password"
  }

  const getButtonText = () => {
    if (isInvitationFlow) return "Complete Setup"
    if (isPasswordReset) return "Update Password"
    return "Complete Setup"
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isInvitationFlow && userEmail && (
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={userEmail} disabled className="bg-muted" />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">{isPasswordReset ? "New Password" : "Password"}</Label>
        <Input
          id="password"
          type="password"
          placeholder={isPasswordReset ? "Enter your new password" : "Enter your password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          noValidate
        />
        {password && password.length < 8 && (
          <p className="text-sm text-muted-foreground">Password must be at least 8 characters ({password.length}/8)</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          noValidate
        />
        {confirmPassword && password !== confirmPassword && (
          <p className="text-sm text-destructive">Passwords do not match</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending || !password || !confirmPassword}>
        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {getButtonText()}
      </Button>
    </form>
  )
}
