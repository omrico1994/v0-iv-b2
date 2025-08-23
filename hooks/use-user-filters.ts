"use client"

import { useState, useMemo } from "react"
import type { UserWithDetails } from "@/lib/actions/user-dashboard"

interface UserFilters {
  role: string
  retailerId: string
  status: string
  search: string
}

export function useUserFilters(allUsers: UserWithDetails[]) {
  const [filters, setFilters] = useState<UserFilters>({
    role: "all",
    retailerId: "all",
    status: "all",
    search: "",
  })

  const filteredUsers = useMemo(() => {
    let result = allUsers

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      result = result.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm) ||
          `${user.user_profiles.first_name} ${user.user_profiles.last_name}`.toLowerCase().includes(searchTerm),
      )
    }

    if (filters.role !== "all") {
      result = result.filter((user) => user.user_roles[0]?.role === filters.role)
    }

    if (filters.retailerId !== "all") {
      result = result.filter((user) => user.user_roles[0]?.retailer_id === filters.retailerId)
    }

    if (filters.status !== "all") {
      result = result.filter((user) =>
        filters.status === "active" ? user.user_profiles.is_active : !user.user_profiles.is_active,
      )
    }

    return result
  }, [allUsers, filters])

  const updateFilter = (key: keyof UserFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({
      role: "all",
      retailerId: "all",
      status: "all",
      search: "",
    })
  }

  return {
    filters,
    filteredUsers,
    updateFilter,
    resetFilters,
    setFilters,
  }
}
