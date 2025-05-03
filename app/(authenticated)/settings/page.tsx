import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PasswordChangeForm } from "@/components/settings/password-change-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  const isEventPlanner = session.user.role === "event-planner" || session.user.role === "super-admin"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      {isEventPlanner && (
        <Card>
          <CardHeader>
            <CardTitle>Email Templates</CardTitle>
            <CardDescription>Customize email templates for your events.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Create and manage email templates for registration confirmations, rejections, tickets, and more.
            </p>
            <Link href="/settings/email-templates">
              <Button>
                <Mail className="mr-2 h-4 w-4" />
                Manage Email Templates
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your password to keep your account secure.</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordChangeForm userId={session.user.id} />
        </CardContent>
      </Card>
    </div>
  )
}
