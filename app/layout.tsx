import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Manrope } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { ErrorBoundary } from "@/components/error-boundary"
import { ErrorProvider } from "@/components/providers/error-provider"
import "./globals.css"

const geist = GeistSans({ subsets: ["latin"] })
const manrope = Manrope({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geist.variable} ${manrope.variable} antialiased`}>
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <ErrorProvider>
          <ErrorBoundary component="RootLayout" showDetails={true}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              {children}
            </ThemeProvider>
          </ErrorBoundary>
        </ErrorProvider>
      </body>
    </html>
  )
}
