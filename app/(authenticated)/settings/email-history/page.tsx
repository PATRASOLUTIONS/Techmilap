import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { EmailHistoryManager } from "@/components/settings/email-history-manager"

export default async function EmailHistoryPage() {
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
        <h1 className="text-3xl font-bold">Email History</h1>
        <p className="text-muted-foreground mt-2">View and manage all emails sent to your event attendees.</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <EmailHistoryManager userId={session.user.id} />
      </div>
    </div>
  )
}
