import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { EmailDesignManager } from "@/components/settings/email-design-manager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Info } from "lucide-react"

export default async function EmailDesignsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Only event planners and super admins can access this page
  if (session.user.role !== "event-planner" && session.user.role !== "super-admin") {
    redirect("/dashboard")
  }

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Email Designs</h1>
        <p className="text-muted-foreground">
          Customize how your event emails appear to attendees, speakers, and volunteers
        </p>
      </div>

      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            About Email Designs
          </CardTitle>
          <CardDescription>
            Email designs control the appearance of all automated emails sent from your events
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <p>Your email design choice affects how all your event communications appear to recipients, including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Registration confirmations and rejections</li>
              <li>Ticket delivery emails</li>
              <li>Speaker and volunteer application responses</li>
              <li>Event reminders and updates</li>
            </ul>
            <p>
              Select a design that matches your brand and provides the best experience for your attendees. You can
              preview each design before making your selection.
            </p>
          </div>
        </CardContent>
      </Card>

      <EmailDesignManager userId={session.user.id} />
    </div>
  )
}
