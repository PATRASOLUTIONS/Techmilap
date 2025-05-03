import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { EmailTemplateManager } from "@/components/settings/email-template-manager"

export default async function EmailTemplatesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Only event planners and super admins can access this page
  if (session.user.role !== "event-planner" && session.user.role !== "super-admin") {
    redirect("/dashboard")
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Email Templates</h1>
        <p className="text-muted-foreground mt-2">
          Create and manage email templates for different types of communications with your attendees.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <EmailTemplateManager userId={session.user.id} />
      </div>
    </div>
  )
}
