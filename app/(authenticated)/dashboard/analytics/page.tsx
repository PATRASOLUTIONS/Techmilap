import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { EventAnalytics } from "@/components/events/event-analytics"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Only event planners and super admins can access analytics
  if (session.user.role !== "event-planner" && session.user.role !== "super-admin") {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Event Analytics</h1>
        <p className="text-muted-foreground">Track performance and gain insights into your events.</p>
      </div>

      <Tabs defaultValue="event1" className="space-y-4">
        <TabsList>
          <TabsTrigger value="event1">Tech Conference 2023</TabsTrigger>
          <TabsTrigger value="event2">Developer Workshop</TabsTrigger>
          <TabsTrigger value="event3">AI Summit</TabsTrigger>
        </TabsList>

        <TabsContent value="event1">
          <EventAnalytics eventId="1" eventName="Tech Conference 2023" />
        </TabsContent>

        <TabsContent value="event2">
          <EventAnalytics eventId="2" eventName="Developer Workshop" />
        </TabsContent>

        <TabsContent value="event3">
          <EventAnalytics eventId="3" eventName="AI Summit" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
