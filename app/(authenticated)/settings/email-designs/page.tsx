import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { EmailDesignManager } from "@/components/settings/email-design-manager"

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
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Designs</h1>
        <p className="text-muted-foreground">Choose from beautiful email designs to customize your communications</p>
      </div>
      <EmailDesignManager userId={session.user.id} />
    </div>
  )
}
