"use client"

import { useEffect } from "react"

interface ErrorLoggerProps {
  onError?: (error: ErrorEvent | PromiseRejectionEvent) => void
}

export function ErrorLogger({ onError }: ErrorLoggerProps) {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const errorData = {
        type: "javascript-error",
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }

      console.error("JavaScript Error:", errorData)
      onError?.(event)

      // In production, send to monitoring service
      // sendErrorToService(errorData)
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorData = {
        type: "unhandled-promise-rejection",
        reason: event.reason,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }

      console.error("Unhandled Promise Rejection:", errorData)
      onError?.(event)

      // In production, send to monitoring service
      // sendErrorToService(errorData)
    }

    // Listen for JavaScript errors
    window.addEventListener("error", handleError)

    // Listen for unhandled promise rejections
    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [onError])

  return null
}
