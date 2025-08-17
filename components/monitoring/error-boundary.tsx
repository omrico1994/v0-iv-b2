"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error Boundary caught an error:", error, errorInfo)

    // Log error to monitoring service
    this.logError(error, errorInfo)

    // Call custom error handler
    this.props.onError?.(error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })
  }

  logError = async (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      // In production, send to monitoring service
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }

      // Log to console in development
      console.error("Error logged:", errorData)

      // In production, you would send this to your monitoring service
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // })
    } catch (loggingError) {
      console.error("Failed to log error:", loggingError)
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />
      }

      return <DefaultErrorFallback error={this.state.error!} resetError={this.resetError} />
    }

    return this.props.children
  }
}

interface DefaultErrorFallbackProps {
  error: Error
  resetError: () => void
}

function DefaultErrorFallback({ error, resetError }: DefaultErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === "development"

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>An unexpected error occurred. We've been notified and are working on a fix.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDevelopment && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Development Error:</strong> {error.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={resetError} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/")} className="flex-1">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>

          {isDevelopment && error.stack && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium">Error Details (Development)</summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-40">{error.stack}</pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
