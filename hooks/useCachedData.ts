"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface CachedDataState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  lastFetched: number | null
}

interface UseCachedDataOptions {
  cacheTime?: number // Cache duration in milliseconds (default: 5 minutes)
  staleTime?: number // Time before data is considered stale (default: 1 minute)
  refetchOnMount?: boolean
}

// Global cache to store data across component instances
const globalCache = new Map<string, { data: any; timestamp: number; promise?: Promise<any> }>()

export function useCachedData<T>(key: string, fetcher: () => Promise<T>, options: UseCachedDataOptions = {}) {
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 1 * 60 * 1000, // 1 minute
    refetchOnMount = true,
  } = options

  const [state, setState] = useState<CachedDataState<T>>({
    data: null,
    isLoading: true,
    error: null,
    lastFetched: null,
  })

  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const fetchData = useCallback(
    async (force = false) => {
      const now = Date.now()
      const cached = globalCache.get(key)

      // Return cached data if it's still fresh and not forced
      if (!force && cached && now - cached.timestamp < staleTime) {
        setState({
          data: cached.data,
          isLoading: false,
          error: null,
          lastFetched: cached.timestamp,
        })
        return cached.data
      }

      // If there's already a pending promise, return it
      if (cached?.promise) {
        try {
          const result = await cached.promise
          return result
        } catch (error) {
          // Promise failed, continue with new fetch
        }
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        // Create and cache the promise to prevent duplicate requests
        const promise = fetcherRef.current()
        globalCache.set(key, { data: cached?.data || null, timestamp: cached?.timestamp || 0, promise })

        const result = await promise

        // Update cache with successful result
        globalCache.set(key, { data: result, timestamp: now })

        setState({
          data: result,
          isLoading: false,
          error: null,
          lastFetched: now,
        })

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An error occurred"

        // Remove failed promise from cache
        const currentCached = globalCache.get(key)
        if (currentCached) {
          globalCache.set(key, { data: currentCached.data, timestamp: currentCached.timestamp })
        }

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }))

        throw error
      }
    },
    [key, staleTime],
  )

  const refetch = useCallback(() => fetchData(true), [fetchData])

  const mutate = useCallback(
    (newData: T | ((prevData: T | null) => T)) => {
      const updatedData = typeof newData === "function" ? (newData as (prevData: T | null) => T)(state.data) : newData

      const now = Date.now()
      globalCache.set(key, { data: updatedData, timestamp: now })

      setState({
        data: updatedData,
        isLoading: false,
        error: null,
        lastFetched: now,
      })
    },
    [key, state.data],
  )

  useEffect(() => {
    const now = Date.now()
    const cached = globalCache.get(key)

    // Check if we have valid cached data
    if (cached && now - cached.timestamp < cacheTime) {
      const isStale = now - cached.timestamp >= staleTime

      setState({
        data: cached.data,
        isLoading: isStale && refetchOnMount,
        error: null,
        lastFetched: cached.timestamp,
      })

      // Fetch fresh data in background if stale
      if (isStale && refetchOnMount) {
        fetchData().catch(() => {
          // Ignore background fetch errors, keep existing data
        })
      }
    } else if (refetchOnMount) {
      // No valid cache, fetch data
      fetchData().catch(() => {
        // Error handling is done in fetchData
      })
    }
  }, [key, cacheTime, staleTime, refetchOnMount, fetchData])

  // Cleanup expired cache entries
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now()
      for (const [cacheKey, cached] of globalCache.entries()) {
        if (now - cached.timestamp > cacheTime) {
          globalCache.delete(cacheKey)
        }
      }
    }

    const interval = setInterval(cleanup, cacheTime)
    return () => clearInterval(interval)
  }, [cacheTime])

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
    mutate,
    lastFetched: state.lastFetched,
  }
}

// Utility function to invalidate cache entries
export function invalidateCache(pattern?: string | RegExp) {
  if (!pattern) {
    globalCache.clear()
    return
  }

  const keysToDelete: string[] = []

  for (const key of globalCache.keys()) {
    if (typeof pattern === "string" && key.includes(pattern)) {
      keysToDelete.push(key)
    } else if (pattern instanceof RegExp && pattern.test(key)) {
      keysToDelete.push(key)
    }
  }

  keysToDelete.forEach((key) => globalCache.delete(key))
}
