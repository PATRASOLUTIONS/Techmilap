"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Users, BarChart3, Settings, PlusCircle, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Log session status for debugging
    console.log("Dashboard - Session status:", status)
    console.log("Dashboard - Session data:", session)

    // Set loading to false once we have session data
    if (status !== "loading") {
      setIsLoading(false)
    }
  }, [session, status, router])

  // Handle any errors that might occur
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error("Dashboard error:", error)
      setError("An error occurred while loading the dashboard. Please try refreshing the page.")
    }

    window.addEventListener("error", handleError)
    return () => window.removeEventListener("error", handleError)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Image
            src="/techmilap-logo-round.png"
            alt="Tech Milap"
            width={80}
            height={80}
            className="mx-auto mb-4 animate-pulse"
          />
          <p className="text-[#170f83]">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-[#c12b6b]">Dashboard Error</CardTitle>
            <CardDescription>We encountered an issue loading your dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>{error}</p>
            <div className="flex space-x-4">
              <Button onClick={() => window.location.reload()} className="bg-[#170f83]">
                Refresh Page
              </Button>
              <Button onClick={() => router.push("/my-events")} className="bg-[#0aacf7]">
                Go to My Events
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user is authenticated
  const isAuthenticated = status === "authenticated" && session

  // If not authenticated, show public dashboard
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#170f83]">Public Dashboard</h1>
          <p className="text-muted-foreground">View event statistics and information</p>
        </div>

        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Public View</AlertTitle>
          <AlertDescription>
            This is a public dashboard view. For full functionality, please{" "}
            <Link href="/login" className="font-medium underline">
              log in
            </Link>{" "}
            to your account.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <CalendarDays className="h-8 w-8 text-[#fea91b] mr-3" />
                <div className="text-2xl font-bold">12</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Attendees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-8 w-8 text-[#0aacf7] mr-3" />
                <div className="text-2xl font-bold">248</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <CalendarDays className="h-8 w-8 text-[#c12b6b] mr-3" />
                <div className="text-2xl font-bold">5</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-[#170f83] mr-3" />
                <div className="text-2xl font-bold">68%</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>Most recent public events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h3 className="font-medium">Tech Conference {i}</h3>
                      <p className="text-sm text-muted-foreground">May {10 + i}, 2023</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{30 + i * 20} Attendees</p>
                      <p className="text-sm text-muted-foreground">{70 + i}% Capacity</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full justify-start bg-[#fea91b]" asChild>
                  <Link href="/events">
                    <CalendarDays className="mr-2 h-4 w-4" /> View Public Events
                  </Link>
                </Button>
                <Button className="w-full justify-start bg-[#0aacf7]" asChild>
                  <Link href="/login">
                    <Users className="mr-2 h-4 w-4" /> Log In
                  </Link>
                </Button>
                <Button className="w-full justify-start bg-[#c12b6b]" asChild>
                  <Link href="/signup">
                    <BarChart3 className="mr-2 h-4 w-4" /> Sign Up
                  </Link>
                </Button>
                <Button className="w-full justify-start bg-[#170f83]" asChild>
                  <Link href="/contact">
                    <Settings className="mr-2 h-4 w-4" /> Contact Us
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Authenticated dashboard view
  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#170f83]">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {session?.user?.name || "Event Planner"}!</p>
        </div>
        <Button className="mt-4 md:mt-0 bg-[#170f83]" asChild>
          <Link href="/create-event">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Event
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CalendarDays className="h-8 w-8 text-[#fea91b] mr-3" />
              <div className="text-2xl font-bold">12</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Attendees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-8 w-8 text-[#0aacf7] mr-3" />
              <div className="text-2xl font-bold">248</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CalendarDays className="h-8 w-8 text-[#c12b6b] mr-3" />
              <div className="text-2xl font-bold">5</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-[#170f83] mr-3" />
              <div className="text-2xl font-bold">68%</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Your most recent events and their performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="font-medium">Tech Conference {i}</h3>
                    <p className="text-sm text-muted-foreground">May {10 + i}, 2023</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{30 + i * 20} Attendees</p>
                    <p className="text-sm text-muted-foreground">{70 + i}% Capacity</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button className="w-full justify-start bg-[#fea91b]" asChild>
                <Link href="/my-events">
                  <CalendarDays className="mr-2 h-4 w-4" /> View All Events
                </Link>
              </Button>
              <Button className="w-full justify-start bg-[#0aacf7]" asChild>
                <Link href="/dashboard/attendees">
                  <Users className="mr-2 h-4 w-4" /> Manage Attendees
                </Link>
              </Button>
              <Button className="w-full justify-start bg-[#c12b6b]" asChild>
                <Link href="/dashboard/analytics">
                  <BarChart3 className="mr-2 h-4 w-4" /> View Analytics
                </Link>
              </Button>
              <Button className="w-full justify-start bg-[#170f83]" asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" /> Account Settings
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
