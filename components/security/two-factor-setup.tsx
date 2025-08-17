"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { QRCodeSVG } from "qrcode.react"
import { Shield, Copy, Check } from "lucide-react"

interface TwoFactorSetupProps {
  onComplete: (secret: string, code: string) => void
  onCancel: () => void
}

export function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const [step, setStep] = useState<"setup" | "verify">("setup")
  const [secret, setSecret] = useState("")
  const [qrCode, setQrCode] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const generateSecret = async () => {
    setLoading(true)
    try {
      // Generate TOTP secret (in production, this would be done server-side)
      const newSecret = Array.from(crypto.getRandomValues(new Uint8Array(20)))
        .map((b) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"[b % 32])
        .join("")

      setSecret(newSecret)

      // Generate QR code URL
      const appName = "Your App"
      const userEmail = "user@example.com" // This would come from user context
      const qrUrl = `otpauth://totp/${appName}:${userEmail}?secret=${newSecret}&issuer=${appName}`
      setQrCode(qrUrl)

      setStep("verify")
    } catch (error) {
      console.error("Error generating 2FA secret:", error)
    } finally {
      setLoading(false)
    }
  }

  const copySecret = async () => {
    await navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const verifyCode = () => {
    if (verificationCode.length === 6) {
      onComplete(secret, verificationCode)
    }
  }

  if (step === "setup") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Enable Two-Factor Authentication
          </CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              You'll need an authenticator app like Google Authenticator, Authy, or 1Password.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button onClick={generateSecret} disabled={loading} className="flex-1">
              {loading ? "Generating..." : "Generate QR Code"}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Scan QR Code</CardTitle>
        <CardDescription>Scan this QR code with your authenticator app</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center p-4 bg-white rounded-lg">
          <QRCodeSVG value={qrCode} size={200} />
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-600">Or enter this code manually:</p>
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded font-mono text-sm">
            <span className="flex-1">{secret}</span>
            <Button size="sm" variant="ghost" onClick={copySecret}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Enter verification code:</label>
          <Input
            type="text"
            placeholder="000000"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="text-center text-lg tracking-widest"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={verifyCode} disabled={verificationCode.length !== 6} className="flex-1">
            Verify & Enable
          </Button>
          <Button variant="outline" onClick={() => setStep("setup")}>
            Back
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
