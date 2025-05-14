import type React from "react"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      redirect("/login")
    }

    console.log("Authenticated layout rendering for user:", session.user.name, "with role:", session.user.role)

    return (
      <div className="flex min-h-screen flex-col">
        <DashboardSidebar />
        <div className="flex-1 md:ml-64">
          <div className="container mx-auto p-6">{children}</div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error in authenticated layout:", error)
    // Return a fallback UI instead of redirecting to prevent infinite loops
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Session Error</h1>
          <p>There was a problem loading your session.</p>
          <a href="/login" className="text-blue-600 hover:underline mt-4 inline-block">
            Return to login
          </a>
        </div>
      </div>
    )
  }
}
