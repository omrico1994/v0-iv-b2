import { Suspense } from "react"
import { LocationManagement } from "@/components/admin/location-management"

export const dynamic = "force-dynamic"

export default function LocationsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground mb-2">Location Management</h1>
        <p className="text-muted-foreground">
          Manage locations across all retailers and assign users to specific locations.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }
      >
        <LocationManagement />
      </Suspense>
    </div>
  )
}
