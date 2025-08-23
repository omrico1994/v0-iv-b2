"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { logger } from "@/lib/utils/logger"

interface ErrorState {
  errors: Array<{
    id: string
    message: string
    timestamp: Date
    component?: string
    action?: string
    dismissed?: boolean
  }>
}

interface ErrorContextType extends ErrorState {
  addError: (message: string, component?: string, action?: string) => string
  dismissError: (id: string) => void
  clearErrors: () => void
  getActiveErrors: () => ErrorState["errors"]
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ErrorState>({ errors: [] })

  const addError = useCallback((message: string, component?: string, action?: string): string => {
    const id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const error = {
      id,
      message,
      timestamp: new Date(),
      component,
      action,
      dismissed: false,
    }

    setState((prev) => ({
      errors: [...prev.errors, error],
    }))

    // Log the error
    logger.error(`Global error: ${message}`, undefined, {
      errorId: id,
      component,
      action,
      globalError: true,
    })

    return id
  }, [])

  const dismissError = useCallback((id: string) => {
    setState((prev) => ({
      errors: prev.errors.map((error) => (error.id === id ? { ...error, dismissed: true } : error)),
    }))

    logger.info(`Error dismissed: ${id}`, { errorId: id, action: "dismiss_error" })
  }, [])

  const clearErrors = useCallback(() => {
    setState({ errors: [] })
    logger.info("All errors cleared", { action: "clear_all_errors" })
  }, [])

  const getActiveErrors = useCallback(() => {
    return state.errors.filter((error) => !error.dismissed)
  }, [state.errors])

  const value: ErrorContextType = {
    ...state,
    addError,
    dismissError,
    clearErrors,
    getActiveErrors,
  }

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>
}

export function useErrorContext() {
  const context = useContext(ErrorContext)
  if (context === undefined) {
    throw new Error("useErrorContext must be used within an ErrorProvider")
  }
  return context
}
