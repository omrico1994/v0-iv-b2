"use client"

import { useEffect } from "react"

export function SecurityHeaders() {
  useEffect(() => {
    // Set security headers via meta tags (for client-side)
    const setMetaTag = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement
      if (!meta) {
        meta = document.createElement("meta")
        meta.name = name
        document.head.appendChild(meta)
      }
      meta.content = content
    }

    // Content Security Policy
    setMetaTag(
      "Content-Security-Policy",
      "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co;",
    )

    // Other security headers
    setMetaTag("X-Frame-Options", "DENY")
    setMetaTag("X-Content-Type-Options", "nosniff")
    setMetaTag("Referrer-Policy", "strict-origin-when-cross-origin")
    setMetaTag("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  }, [])

  return null
}
