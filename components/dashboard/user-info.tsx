"use client"

import { useEffect, useState } from "react"

interface User {
  id: string
  email: string
  role: string
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  profile_photo_url?: string | null
  locations?: any[]
}

interface UserInfoProps {
  user: User
}

export function UserInfo({ user }: UserInfoProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">User Info</h2>
        <div className="space-y-1">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  const displayName = user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <h2 className="text-lg font-semibold mb-2">User Info</h2>
      <p>Name: {displayName}</p>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      {user.phone && <p>Phone: {user.phone}</p>}
      <p>ID: {user.id}</p>
    </div>
  )
}
