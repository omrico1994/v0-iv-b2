import { getCurrentUser } from "@/lib/auth/get-user"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    return null // This should not happen due to layout protection
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "admin":
        return "Full system access with user management capabilities"
      case "office":
        return "Administrative access with reporting and oversight functions"
      case "retailer":
        return "Manage all locations and operations for your retail business"
      case "location_user":
        return "Access to specific location operations and tasks"
      default:
        return "Standard user access"
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "office":
        return "secondary"
      case "retailer":
        return "default"
      case "location_user":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user.email}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Your Role
              <Badge variant={getRoleBadgeVariant(user.role)}>{user.role.replace("_", " ").toUpperCase()}</Badge>
            </CardTitle>
            <CardDescription>{getRoleDescription(user.role)}</CardDescription>
          </CardHeader>
        </Card>

        {user.retailer_id && (
          <Card>
            <CardHeader>
              <CardTitle>Retailer Access</CardTitle>
              <CardDescription>You have access to retailer: {user.retailer_id}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {user.locations && user.locations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Location Access</CardTitle>
              <CardDescription>You have access to {user.locations.length} location(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {user.locations.map((location) => (
                  <div key={location.id} className="text-sm">
                    <div className="font-medium">{location.name}</div>
                    <div className="text-muted-foreground">ID: {location.id}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks based on your role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {user.role === "admin" && (
              <>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium">User Management</h3>
                  <p className="text-sm text-muted-foreground">Manage system users</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium">System Settings</h3>
                  <p className="text-sm text-muted-foreground">Configure system</p>
                </div>
              </>
            )}

            {(user.role === "admin" || user.role === "office") && (
              <>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium">Reports</h3>
                  <p className="text-sm text-muted-foreground">View analytics</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium">Audit Logs</h3>
                  <p className="text-sm text-muted-foreground">Review system activity</p>
                </div>
              </>
            )}

            {(user.role === "retailer" || user.role === "location_user") && (
              <>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium">Orders</h3>
                  <p className="text-sm text-muted-foreground">Manage orders</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium">Inventory</h3>
                  <p className="text-sm text-muted-foreground">Track inventory</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
