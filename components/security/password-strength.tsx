"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Check, X } from "lucide-react"

interface PasswordStrengthProps {
  password: string
  onValidityChange: (isValid: boolean) => void
}

export function PasswordStrength({ password, onValidityChange }: PasswordStrengthProps) {
  const [strength, setStrength] = useState(0)
  const [checks, setChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  })

  useEffect(() => {
    const newChecks = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    setChecks(newChecks)

    const score = Object.values(newChecks).filter(Boolean).length
    setStrength((score / 5) * 100)

    // Password is valid if all checks pass
    onValidityChange(Object.values(newChecks).every(Boolean))
  }, [password, onValidityChange])

  const getStrengthColor = () => {
    if (strength < 40) return "bg-red-500"
    if (strength < 80) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getStrengthText = () => {
    if (strength < 40) return "Weak"
    if (strength < 80) return "Medium"
    return "Strong"
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Password Strength</span>
          <span
            className={`font-medium ${strength < 40 ? "text-red-500" : strength < 80 ? "text-yellow-500" : "text-green-500"}`}
          >
            {getStrengthText()}
          </span>
        </div>
        <Progress value={strength} className="h-2">
          <div className={`h-full transition-all ${getStrengthColor()}`} style={{ width: `${strength}%` }} />
        </Progress>
      </div>

      <div className="space-y-1 text-sm">
        {Object.entries({
          length: "At least 12 characters",
          uppercase: "One uppercase letter",
          lowercase: "One lowercase letter",
          number: "One number",
          special: "One special character",
        }).map(([key, text]) => (
          <div key={key} className="flex items-center gap-2">
            {checks[key as keyof typeof checks] ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-red-500" />
            )}
            <span className={checks[key as keyof typeof checks] ? "text-green-600" : "text-gray-500"}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
