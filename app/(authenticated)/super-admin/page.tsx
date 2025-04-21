import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function SuperAdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {session.user.name}!</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage platform users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Total users: 0</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/super-admin/users">View Users</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Events</CardTitle>
            <CardDescription>All platform events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Total events: 5</p>
            <Button asChild className="w-full">
              <Link href="/my-events">View Events</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Platform health</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-green-500">All systems operational</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
