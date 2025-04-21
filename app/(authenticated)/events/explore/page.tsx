"use client"

import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { EventCard } from "@/components/events/event-card"

async function getPublicEvents() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const response = await fetch(`${baseUrl}/api/events/public`, {
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.status}`)
    }

    const data = await response.json()
    return data.events || []
  } catch (error) {
    console.error("Error fetching public events:", error)
    return []
  }
}

export default async function PublicEventsPage() {
  const events = await getPublicEvents()

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Upcoming Events</h1>
      <Suspense fallback={<EventsLoading />}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      </Suspense>
    </div>
  )
}

function EventsLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Loading events...</p>
    </div>
  )
}
