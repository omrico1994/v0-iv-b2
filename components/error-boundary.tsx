"use client"

import type React from "react"

import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react"
import { logger } from "@/lib/utils/logger"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: any) => void
  showDetails?: boolean
  component?: string
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: any
  errorId?: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return {
      hasError: true,
      error,
      errorId,
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    const errorId = this.state.errorId || `error_${Date.now()}`

    // Log to our structured logger
    logger.componentError(this.props.component || "Unknown Component", error, {
      errorId,
      errorInfo,
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "server",
      url: typeof window !== "undefined" ? window.location.href : "server",
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // In production, you would send this to an error monitoring service
    if (process.env.NODE_ENV === "production") {
      // Example: Send to Sentry, LogRocket, or other monitoring service
      // Sentry.captureException(error, { contexts: { errorInfo, errorId } })
      console.error("[ErrorBoundary] Production error captured:", {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      })
    }

    this.setState({ errorInfo, errorId })
  }

  handleRetry = () => {
    logger.userAction("error_boundary_retry", "unknown", {
      errorId: this.state.errorId,
      component: this.props.component,
    })
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorId: undefined })
  }

  handleReportError = () => {
    if (this.state.error && this.state.errorId) {
      logger.userAction("error_boundary_report", "unknown", {
        errorId: this.state.errorId,
        component: this.props.component,
        action: "user_reported_error",
      })

      // In a real app, this would open a support ticket or feedback form
      alert(`Error reported with ID: ${this.state.errorId}. Our team has been notified.`)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const isDevelopment = process.env.NODE_ENV === "development"

      return (
        <div className="min-h-[200px] flex items-center justify-center p-4">
          <Alert className="max-w-2xl border-destructive bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertTitle className="text-destructive font-semibold">Something went wrong</AlertTitle>
            <AlertDescription className="mt-2 space-y-4">
              <p className="text-destructive/90">
                An unexpected error occurred while loading this section.
                {this.state.errorId && (
                  <span className="block text-sm mt-1 font-mono">Error ID: {this.state.errorId}</span>
                )}
              </p>

              {isDevelopment && this.props.showDetails && this.state.error && (
                <details className="mt-4 p-3 bg-muted rounded border">
                  <summary className="cursor-pointer font-medium text-sm">Technical Details (Development Only)</summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong>Error:</strong>
                      <pre className="text-xs mt-1 p-2 bg-background rounded overflow-auto">
                        {this.state.error.message}
                      </pre>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className="text-xs mt-1 p-2 bg-background rounded overflow-auto max-h-32">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="text-xs mt-1 p-2 bg-background rounded overflow-auto max-h-32">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={this.handleRetry} size="sm" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => (window.location.href = "/dashboard")}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go to Dashboard
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleReportError}
                  className="flex items-center gap-2 bg-transparent"
                >
                  <Bug className="h-4 w-4" />
                  Report Issue
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">,
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps} component={Component.displayName || Component.name}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}
