import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { EventList } from "@/components/events/event-list"
import { EventEmptyState } from "@/components/events/event-empty-state"
import { EventFilters } from "@/components/events/event-filters"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"

export default async function ExplorePage({ searchParams }: { searchParams: { category?: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Explore Events</h1>
            <p className="text-muted-foreground">Please sign in to explore events.</p>
          </div>
        </div>
      )
    }

    await connectToDatabase()

    const category = searchParams.category

    // Build query
    const query: any = { status: "published" }
    if (category) {
      query.category = category
    }

    // Find published events with form status information
    const events = await Event.find(query).populate("organizer", "firstName lastName").sort({ date: 1 }).lean()

    // Client-side filtering to remove past events
    const currentDate = new Date()
    const upcomingEvents = events.filter((event) => {
      // Handle events with no date or invalid date
      if (!event.date) return true
      try {
        return new Date(event.date) >= currentDate
      } catch (e) {
        console.error("Invalid date format:", event.date)
        return true // Include events with invalid dates
      }
    })

    // Get all unique categories for the filter
    const categories = await Event.distinct("category", { status: "published" })

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Explore Events</h1>
          <p className="text-muted-foreground">Discover and register for upcoming tech events.</p>
        </div>

        <EventFilters categories={categories} selectedCategory={category} />

        {upcomingEvents.length > 0 ? (
          <EventList events={upcomingEvents} showRegisterButton />
        ) : (
          <EventEmptyState
            title="No events found"
            description="No events match your current filters. Try changing your search criteria."
          />
        )}
      </div>
    )
  } catch (error) {
    console.error("Error in ExplorePage:", error)
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Explore Events</h1>
          <p className="text-red-500">Sorry, we encountered an error loading events. Please try again later.</p>
        </div>
      </div>
    )
  }
}
