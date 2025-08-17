import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"
import { ThemeProvider } from "next-themes"
import { Toaster } from "react-hot-toast"
import { SecurityHeaders } from "@/components/security/security-headers"
import { ErrorBoundary } from "@/components/monitoring/error-boundary"
import { PerformanceMonitor } from "@/components/monitoring/performance-monitor"
import { ErrorLogger } from "@/components/monitoring/error-logger"

export const metadata: Metadata = {
  title: "Secure App",
  description: "Production-ready authentication system",
  generator: "v0.app",
  other: {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <SecurityHeaders />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className={GeistSans.className}>
        <ErrorBoundary>
          <AuthProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              {children}
              <Toaster />
              <PerformanceMonitor
                onMetrics={(metrics) => {
                  console.log("Performance metrics:", metrics)
                  // In production, send to monitoring service
                }}
              />
              <ErrorLogger
                onError={(error) => {
                  console.log("Error logged:", error)
                  // In production, send to monitoring service
                }}
              />
            </ThemeProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
