import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { EventCategories } from "@/components/events/event-categories"

export default async function EventCategoriesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Only super admins can access this page
  if (session.user.role !== "super-admin") {
    redirect("/dashboard")
  }

  // Mock data for demonstration
  const categories = [
    "Technology",
    "Web Development",
    "Mobile Development",
    "Data Science",
    "AI & Machine Learning",
    "DevOps",
    "Cloud Computing",
    "Cybersecurity",
    "Blockchain",
    "IoT",
    "Design",
    "Product Management",
    "Startup",
    "Career Development",
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Event Categories</h1>
        <p className="text-muted-foreground">Manage the categories available for event organizers.</p>
      </div>

      <EventCategories initialCategories={categories} />
    </div>
  )
}
