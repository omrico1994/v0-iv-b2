import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-user"
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

  const user = await getCurrentUser()

  if (!user) {
    // User is not authenticated, redirect to login
    redirect("/auth/login")
  }

  if (!user.role) {
    // User has no role, redirect to access pending
    redirect("/")
  }

  // Check if user's role matches the requested dashboard
  if (user.role !== role) {
    // Redirect to correct dashboard for user's role
    redirect(`/dashboard/${user.role}`)
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
