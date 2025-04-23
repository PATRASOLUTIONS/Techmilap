"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventList } from "@/components/events/event-list"
import { EventEmptyState } from "@/components/events/event-empty-state"
import { Calendar, Users, Mic, HandHelping } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function MyEventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const roleParam = searchParams.get("role")
  const [activeTab, setActiveTab] = useState(roleParam || "all")

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch all events first to avoid multiple API calls
        const response = await fetch("/api/events/my-events")

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }

        const data = await response.json()
        setEvents(data.events || [])
      } catch (err: any) {
        console.error("Failed to fetch events:", err)
        setError(err.message || "Failed to load events")
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // Filter events based on active tab
  const filteredEvents = events.filter((event) => {
    if (activeTab === "all") return true
    return event.userRole === activeTab
  })

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (error) {
      return (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">Error loading events: {error}</p>
          <p className="mt-2 text-sm text-muted-foreground">Please try again later</p>
        </div>
      )
    }

    if (filteredEvents.length === 0) {
      return (
        <EventEmptyState
          role={activeTab === "all" ? undefined : activeTab}
          showCreateButton={activeTab === "all" || activeTab === "organizer"}
        />
      )
    }

    return <EventList events={filteredEvents} showUserRole={true} />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Events</h1>
        <p className="text-muted-foreground">View and manage all events you're participating in</p>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 md:w-auto">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">All Events</span>
            <span className="sm:hidden">All</span>
          </TabsTrigger>
          <TabsTrigger value="attendee" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Attending</span>
            <span className="sm:hidden">Attend</span>
          </TabsTrigger>
          <TabsTrigger value="volunteer" className="flex items-center gap-2">
            <HandHelping className="h-4 w-4" />
            <span className="hidden sm:inline">Volunteering</span>
            <span className="sm:hidden">Volunteer</span>
          </TabsTrigger>
          <TabsTrigger value="speaker" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            <span className="hidden sm:inline">Speaking</span>
            <span className="sm:hidden">Speak</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-6">
          {renderContent()}
        </TabsContent>
      </Tabs>
    </div>
  )
}
