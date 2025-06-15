import type React from "react"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      console.log("No session found in authenticated layout, redirecting to login")
      redirect("/login")
    }

    console.log("Session: ", session)

    // Ensure we have a role, defaulting to "user" if not set
    const userRole = session.user.role || "user"
    console.log("Authenticated layout rendering for user:", session.user.name, "with role:", userRole)

    return (
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <div className="flex flex-1">
          <DashboardSidebar />
          <main className="flex-1 p-6 md:p-8 pt-6">{children}</main>
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
