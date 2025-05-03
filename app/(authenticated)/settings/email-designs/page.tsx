import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { EmailDesignManager } from "@/components/settings/email-design-manager"

export default async function EmailDesignsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Email Design Templates</h1>
      <p className="text-muted-foreground mb-8">
        Choose a design template for all your event emails. This design will be applied to registration confirmations,
        notifications, and other communications sent to your attendees.
      </p>

      <EmailDesignManager userId={session.user.id} />
    </div>
  )
}
