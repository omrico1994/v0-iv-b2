"use client"

import { useEffect, useRef } from "react"

interface PerformanceMetrics {
  pageLoadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
}

interface PerformanceMonitorProps {
  onMetrics?: (metrics: Partial<PerformanceMetrics>) => void
}

export function PerformanceMonitor({ onMetrics }: PerformanceMonitorProps) {
  const metricsRef = useRef<Partial<PerformanceMetrics>>({})

  useEffect(() => {
    const collectMetrics = () => {
      // Collect Core Web Vitals and other performance metrics
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
      const paint = performance.getEntriesByType("paint")

      const metrics: Partial<PerformanceMetrics> = {}

      // Page Load Time
      if (navigation) {
        metrics.pageLoadTime = navigation.loadEventEnd - navigation.loadEventStart
      }

      // First Contentful Paint
      const fcp = paint.find((entry) => entry.name === "first-contentful-paint")
      if (fcp) {
        metrics.firstContentfulPaint = fcp.startTime
      }

      // Largest Contentful Paint
      if ("PerformanceObserver" in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          if (lastEntry) {
            metrics.largestContentfulPaint = lastEntry.startTime
            metricsRef.current = { ...metricsRef.current, ...metrics }
            onMetrics?.(metrics)
          }
        })

        try {
          lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] })
        } catch (e) {
          console.warn("LCP observer not supported")
        }

        // Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
            }
          }
          metrics.cumulativeLayoutShift = clsValue
          metricsRef.current = { ...metricsRef.current, ...metrics }
          onMetrics?.(metrics)
        })

        try {
          clsObserver.observe({ entryTypes: ["layout-shift"] })
        } catch (e) {
          console.warn("CLS observer not supported")
        }

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            metrics.firstInputDelay = (entry as any).processingStart - entry.startTime
            metricsRef.current = { ...metricsRef.current, ...metrics }
            onMetrics?.(metrics)
          }
        })

        try {
          fidObserver.observe({ entryTypes: ["first-input"] })
        } catch (e) {
          console.warn("FID observer not supported")
        }
      }

      // Send initial metrics
      metricsRef.current = { ...metricsRef.current, ...metrics }
      onMetrics?.(metrics)
    }

    // Collect metrics when page is loaded
    if (document.readyState === "complete") {
      collectMetrics()
    } else {
      window.addEventListener("load", collectMetrics)
    }

    return () => {
      window.removeEventListener("load", collectMetrics)
    }
  }, [onMetrics])

  // Send metrics when component unmounts (page navigation)
  useEffect(() => {
    return () => {
      if (Object.keys(metricsRef.current).length > 0) {
        // Send final metrics to monitoring service
        console.log("Final performance metrics:", metricsRef.current)
      }
    }
  }, [])

  return null
}
