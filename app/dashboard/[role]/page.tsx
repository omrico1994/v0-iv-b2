import { notFound } from "next/navigation"
import { getCurrentUserContext } from "@/lib/auth/getCurrentUserContext"
import { OwnerDashboard } from "@/components/dashboard/owner-dashboard"
import { RetailerDashboard } from "@/components/dashboard/retailer-dashboard"
import { LocationStaffDashboard } from "@/components/dashboard/location-staff-dashboard"
import { BackofficeDashboard } from "@/components/dashboard/backoffice-dashboard"

const VALID_ROLES = ["owner", "retailer", "location_staff", "backoffice"] as const
type Role = (typeof VALID_ROLES)[number]

interface DashboardPageProps {
  params: {
    role: string
  }
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { role } = params

  // Validate role parameter
  if (!VALID_ROLES.includes(role as Role)) {
    notFound()
  }

  const userContext = await getCurrentUserContext()

  if (!userContext) {
    // User is not authenticated, this should be handled by middleware
    // but adding as fallback
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
            <p className="text-gray-600">Please log in to access this page.</p>
          </div>
        </div>
      </div>
    )
  }

  // Check if user's role matches the requested dashboard
  if (userContext.role !== role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">You don't have access to this page</h1>
            <p className="text-gray-600">Your current role does not allow access to this dashboard.</p>
          </div>
        </div>
      </div>
    )
  }

  // Render appropriate dashboard based on role
  switch (role as Role) {
    case "owner":
      return <OwnerDashboard />
    case "retailer":
      return <RetailerDashboard />
    case "location_staff":
      return <LocationStaffDashboard />
    case "backoffice":
      return <BackofficeDashboard />
    default:
      notFound()
  }
}

// Generate static params for known roles
export function generateStaticParams() {
  return VALID_ROLES.map((role) => ({
    role,
  }))
}

// Generate metadata based on role
export function generateMetadata({ params }: DashboardPageProps) {
  const { role } = params

  const roleNames = {
    owner: "Owner",
    retailer: "Retailer",
    location_staff: "Location Staff",
    backoffice: "Back Office",
  }

  return {
    title: `${roleNames[role as Role] || "Dashboard"} - Internal App`,
    description: `${roleNames[role as Role] || "Dashboard"} dashboard for internal app management`,
  }
}
