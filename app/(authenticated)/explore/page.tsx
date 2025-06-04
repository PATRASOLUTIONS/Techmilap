import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { EventList } from "@/components/events/event-list"
import { EventEmptyState } from "@/components/events/event-empty-state"
import { EventFilters } from "@/components/events/event-filters"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import User from "@/models/User" // Import User model to ensure it's registered

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: {
    category?: string
    search?: string
    format?: string
  }
}) {
  try {
    const session = await getServerSession(authOptions)

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
    const format = searchParams.format

    // Build query with proper status filter
    const query: any = { status: { $in: ["published", "active"] } }

    // Add category filter if provided
    if (category && category !== "all") {
      query.category = category
    }

    // Add format filter if provided
    if (format && format !== "all") {
      query.format = format
    }

    // Add search filter if provided
    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    // Find published events - avoid using populate to prevent User model issues
    const events = await Event.find(query).lean()

    // Get organizer information separately to avoid populate issues
    const organizerIds = events.map((event) => event.organizer).filter(Boolean)
    const organizers = organizerIds.length > 0 ? await User.find({ _id: { $in: organizerIds } }).lean() : []

    // Create a map of organizer data for quick lookup
    const organizerMap = organizers.reduce(
      (map, organizer) => {
        map[organizer._id.toString()] = organizer
        return map
      },
      {} as Record<string, any>,
    )

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
    const formattedEvents = upcomingEvents.map((event) => {
      const organizerId = event.organizer ? event.organizer.toString() : null
      const organizer = organizerId && organizerMap[organizerId] ? organizerMap[organizerId] : null

      return {
        ...event,
        _id: event._id.toString(),
        id: event._id.toString(),
        organizer: organizer
          ? {
              id: organizer._id.toString(),
              firstName: organizer.firstName || "Event",
              lastName: organizer.lastName || "Organizer",
              email: organizer.email || "",
            }
          : { firstName: "Event", lastName: "Organizer", email: "" },
      }
    })

    formattedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Store user email in client-side script for comparison
    const userEmail = session.user.email

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Explore Events</h1>
          <p className="text-muted-foreground">Discover and register for upcoming tech events.</p>
        </div>

        <EventFilters
          categories={categories}
          selectedCategory={category}
          selectedFormat={format}
          searchQuery={search || ""}
        />

        {formattedEvents.length > 0 ? (
          <>
            <EventList events={formattedEvents} showRegisterButton />
            {/* Store user email in session storage for client-side components */}
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  if (typeof sessionStorage !== 'undefined') {
                    sessionStorage.setItem('userEmail', '${userEmail || ""}');
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
