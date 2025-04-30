import { getServerSession } from "@/lib/auth"
import { EventList } from "@/components/events/event-list"
import { EventEmptyState } from "@/components/events/event-empty-state"
import { EventFilters } from "@/components/events/event-filters"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"

export default async function ExplorePage({ searchParams }: { searchParams: { category?: string; search?: string } }) {
  try {
    const session = await getServerSession()

    if (!session || !session.user) {
      return (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">Explore Events</h1>
          <p className="text-muted-foreground">Please sign in to explore events.</p>
        </div>
      )
    }

    // Connect to database
    await connectToDatabase()

    // Get filters from search params
    const category = searchParams.category
    const search = searchParams.search

    // Build query with proper status filter
    const query: any = { status: { $in: ["published", "active"] } }

    // Add category filter if provided
    if (category && category !== "all") {
      query.category = category
    }

    // Add search filter if provided
    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    // Find published events
    const events = await Event.find(query).populate("organizer", "firstName lastName email").sort({ date: 1 }).lean()

    // Filter out past events
    const currentDate = new Date()
    const upcomingEvents = events.filter((event) => {
      if (!event.date) return true
      try {
        const eventDate = new Date(event.date)
        return eventDate >= currentDate || (event.endDate && new Date(event.endDate) >= currentDate)
      } catch (e) {
        console.error("Invalid date format:", event.date)
        return true
      }
    })

    // Get all unique categories for the filter
    const categories = await Event.distinct("category", { status: { $in: ["published", "active"] } })

    // Format events to ensure consistent structure
    const formattedEvents = upcomingEvents.map((event) => ({
      ...event,
      _id: event._id.toString(),
      id: event._id.toString(),
      organizer: event.organizer
        ? {
            id: event.organizer._id?.toString(),
            firstName: event.organizer.firstName || "Event",
            lastName: event.organizer.lastName || "Organizer",
            email: event.organizer.email || "",
          }
        : { firstName: "Event", lastName: "Organizer", email: "" },
    }))

    // Store user email in client-side script for comparison
    const userEmail = session.user.email

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Explore Events</h1>
          <p className="text-muted-foreground">Discover and register for upcoming tech events.</p>
        </div>

        <EventFilters categories={categories} selectedCategory={category} searchQuery={search || ""} />

        {formattedEvents.length > 0 ? (
          <>
            <EventList events={formattedEvents} showRegisterButton />
            {/* Store user email in session storage for client-side components */}
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  if (typeof sessionStorage !== 'undefined') {
                    sessionStorage.setItem('userEmail', '${userEmail}');
                  }
                `,
              }}
            />
          </>
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
          {process.env.NODE_ENV === "development" && (
            <pre className="mt-4 p-4 bg-gray-100 rounded text-xs overflow-auto">
              {error instanceof Error ? error.stack : String(error)}
            </pre>
          )}
        </div>
      </div>
    )
  }
}
