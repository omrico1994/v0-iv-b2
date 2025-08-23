"use client"

import { useCallback } from "react"
import { logger } from "@/lib/utils/logger"
import { ErrorMessageHandler } from "@/lib/utils/error-messages"

export interface ErrorHandlerOptions {
  component?: string
  action?: string
  showToast?: boolean
  logLevel?: "error" | "warn" | "info"
  context?: Record<string, any>
}

export function useErrorHandler() {
  const handleError = useCallback((error: Error | string, options: ErrorHandlerOptions = {}) => {
    const { component = "Unknown", action = "unknown_action", logLevel = "error", context = {} } = options

    const errorObj = typeof error === "string" ? new Error(error) : error
    const errorMessage = errorObj.message

    // Log the error with context
    const logContext = {
      ...context,
      component,
      action,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "server",
      url: typeof window !== "undefined" ? window.location.href : "server",
    }

    switch (logLevel) {
      case "error":
        logger.error(`Error in ${component} during ${action}: ${errorMessage}`, errorObj, logContext)
        break
      case "warn":
        logger.warn(`Warning in ${component} during ${action}: ${errorMessage}`, logContext)
        break
      case "info":
        logger.info(`Info in ${component} during ${action}: ${errorMessage}`, logContext)
        break
    }

    // Get user-friendly error message
    const userMessage = ErrorMessageHandler.getErrorMessage(errorObj, {
      type: "validation",
      action,
      details: context,
    })

    return {
      originalError: errorObj,
      userMessage,
      errorId: `${component}_${action}_${Date.now()}`,
      recoveryActions: ErrorMessageHandler.getRecoveryActions(errorObj, {
        type: "validation",
        action,
        details: context,
      }),
    }
  }, [])

  const handleAsyncError = useCallback(
    async (asyncOperation, options) => {
      try {
        const data = await asyncOperation()
        return { data }
      } catch (error) {
        const handledError = handleError(error, options)
        return { error: handledError }
      }
    },
    [handleError],
  )

  const wrapAsyncFunction = useCallback(
    (fn, options) => {
      return async (...args) => {
        return handleAsyncError(() => fn(...args), options)
      }
    },
    [handleAsyncError],
  )

  return {
    handleError,
    handleAsyncError,
    wrapAsyncFunction,
  }
}
