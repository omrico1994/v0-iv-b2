"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import type { UserWithRole } from "@/lib/auth/get-user"

interface ScheduleDashboardProps {
  user: UserWithRole
}

// Mock schedule data
const mockScheduleData = [
  {
    id: "1",
    staff_name: "Dr. Sarah Johnson",
    role: "doctor",
    department: "Emergency Medicine",
    shift_start: "07:00",
    shift_end: "19:00",
    date: "2024-01-15",
    status: "scheduled",
  },
  {
    id: "2",
    staff_name: "Nurse Emily Chen",
    role: "nurse",
    department: "ICU",
    shift_start: "19:00",
    shift_end: "07:00",
    date: "2024-01-15",
    status: "scheduled",
  },
  {
    id: "3",
    staff_name: "Tech Mike Rodriguez",
    role: "technician",
    department: "Equipment Services",
    shift_start: "08:00",
    shift_end: "16:00",
    date: "2024-01-15",
    status: "scheduled",
  },
]

export function ScheduleDashboard({ user }: ScheduleDashboardProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getShiftColor = (role: string) => {
    switch (role) {
      case "doctor":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "nurse":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "technician":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1))
    setCurrentDate(newDate)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Staff Schedule</h1>
          <p className="text-gray-600">Manage staff shifts and scheduling</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Shift
        </Button>
      </div>

      {/* Date Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <CardTitle className="text-xl">{formatDate(currentDate)}</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              View Calendar
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Schedule Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Day Shift</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">7AM - 7PM</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Night Shift</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">7PM - 7AM</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">20</div>
            <p className="text-xs text-muted-foreground">Scheduled today</p>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Details */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
          <CardDescription>Staff assignments and shift details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockScheduleData.map((shift) => (
              <div key={shift.id} className={`border rounded-lg p-4 ${getShiftColor(shift.role)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{shift.staff_name}</h3>
                      <p className="text-sm opacity-75">{shift.department}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <Badge variant="outline" className="mb-1">
                        {shift.role.toUpperCase()}
                      </Badge>
                      <p className="text-sm font-medium">
                        {shift.shift_start} - {shift.shift_end}
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        Contact
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
