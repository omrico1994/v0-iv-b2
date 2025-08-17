"use client"

import type React from "react"

import { Suspense, lazy, type ComponentType } from "react"
import { Loader2 } from "lucide-react"

interface LazyWrapperProps {
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function LazyWrapper({ fallback, children }: LazyWrapperProps) {
  const defaultFallback = (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  )

  return <Suspense fallback={fallback || defaultFallback}>{children}</Suspense>
}

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(Component: ComponentType<P>, fallback?: React.ReactNode) {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }))

  return function WrappedComponent(props: P) {
    return (
      <LazyWrapper fallback={fallback}>
        <LazyComponent {...props} />
      </LazyWrapper>
    )
  }
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit,
) {
  const observer = new IntersectionObserver(callback, {
    threshold: 0.1,
    rootMargin: "50px",
    ...options,
  })

  return observer
}
