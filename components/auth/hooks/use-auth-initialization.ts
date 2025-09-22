"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ErrorMessageHandler, type ErrorContext } from "@/lib/utils/error-messages"

interface AuthState {
  isInitialized: boolean
  isPasswordReset: boolean
  isLinkExpired: boolean
  isInvitationFlow: boolean
  userEmail: string | null
  invitationToken: string | null
  error: string | null
  errorContext: ErrorContext | undefined
  recoveryActions: Array<{ label: string; action: string; primary?: boolean }>
}

export function useAuthInitialization() {
  const [state, setState] = useState<AuthState>({
    isInitialized: false,
    isPasswordReset: false,
    isLinkExpired: false,
    isInvitationFlow: false,
    userEmail: null,
    invitationToken: null,
    error: null,
    errorContext: undefined,
    recoveryActions: [],
  })

  const searchParams = useSearchParams()

  const handleError = useCallback((errorMessage: string | Error, context?: ErrorContext) => {
    const friendlyMessage = ErrorMessageHandler.getErrorMessage(errorMessage, context)
    const actions = ErrorMessageHandler.getRecoveryActions(errorMessage, context)

    setState((prev) => ({
      ...prev,
      error: friendlyMessage,
      errorContext: context,
      recoveryActions: actions,
    }))
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
      errorContext: undefined,
      recoveryActions: [],
    }))
  }, [])

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        // Parse URL parameters synchronously first
        const urlSearchParams = new URLSearchParams(window.location.search)
        const hash = window.location.hash.substring(1)
        const hashParams = new URLSearchParams(hash)

        const errorCode = urlSearchParams.get("error_code") || hashParams.get("error_code")
        const errorDescription = urlSearchParams.get("error_description") || hashParams.get("error_description")

        // Handle expired links immediately
        if (errorCode === "otp_expired" || errorDescription?.includes("expired")) {
          if (isMounted) {
            setState((prev) => ({ ...prev, isLinkExpired: true, isInitialized: true }))
            handleError("This reset link has expired. Please request a new one.", { type: "password_reset" })
          }
          return
        }

        const customToken = searchParams.get("token")
        const email = searchParams.get("email")

        // Handle invitation flow
        if (customToken && email) {
          if (isMounted) {
            setState((prev) => ({
              ...prev,
              isInvitationFlow: true,
              invitationToken: customToken,
              userEmail: email,
            }))
          }

          // Use startTransition for async operations to avoid uncached promise issues
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

            const response = await fetch("/api/validate-invitation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: customToken, email }),
              signal: controller.signal,
            })

            clearTimeout(timeoutId)

            if (!isMounted) return

            const result = await response.json()

            if (!response.ok || !result.valid) {
              handleError(result.error || "Invalid or expired invitation", { type: "invitation" })
            } else {
              clearError()
            }
          } catch (validationError) {
            if (!isMounted) return

            if (validationError instanceof Error && validationError.name === "AbortError") {
              handleError("Request timed out. Please try again.", { type: "invitation" })
            } else {
              handleError("Failed to validate invitation. Please try again.", { type: "invitation" })
            }
          }

          if (isMounted) {
            setState((prev) => ({ ...prev, isInitialized: true }))
          }
          return
        }

        // Handle auth tokens
        let type = searchParams.get("type")
        let accessToken = searchParams.get("access_token")
        let refreshToken = searchParams.get("refresh_token")

        if (!accessToken || !refreshToken) {
          type = type || hashParams.get("type")
          accessToken = accessToken || hashParams.get("access_token")
          refreshToken = refreshToken || hashParams.get("refresh_token")
        }

        // Create Supabase client instance
        const supabase = createClient()

        if (type === "recovery" && accessToken) {
          if (isMounted) {
            setState((prev) => ({ ...prev, isPasswordReset: true }))
            clearError()
          }
        } else if ((type === "signup" || type === "invite") && accessToken && refreshToken) {
          if (isMounted) {
            setState((prev) => ({ ...prev, isPasswordReset: false }))
          }

          try {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (!isMounted) return

            if (sessionError) {
              handleError("Failed to authenticate. Please try clicking the invitation link again.", {
                type: "authentication",
              })
            } else {
              clearError()
            }
          } catch (sessionErr) {
            if (!isMounted) return
            handleError("Failed to set authentication session.", { type: "authentication" })
          }
        } else {
          try {
            const {
              data: { session },
            } = await supabase.auth.getSession()

            if (!isMounted) return

            if (session && session.user) {
              setState((prev) => ({
                ...prev,
                isPasswordReset: true,
                userEmail: session.user.email,
              }))
              clearError()
            } else {
              handleError("Authentication session is missing. Please use the link from your email.", {
                type: "authentication",
              })
            }
          } catch (sessionErr) {
            if (!isMounted) return
            handleError("Failed to get authentication session.", { type: "authentication" })
          }
        }
      } catch (err) {
        if (!isMounted) return
        handleError("Failed to initialize authentication.", { type: "authentication" })
      } finally {
        if (isMounted) {
          setState((prev) => ({ ...prev, isInitialized: true }))
        }
      }
    }

    initializeAuth()

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false
    }
  }, [searchParams, handleError, clearError])

  return {
    ...state,
    handleError,
    clearError,
  }
}
