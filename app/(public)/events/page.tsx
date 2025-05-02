import { Suspense } from "react"
import { connectToDatabase } from "@/lib/mongodb"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Search, Filter } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { PublicEventList } from "@/components/events/public-event-list"

// Types for better type safety
interface Event {
  _id: string
  title: string
  description?: string
  date?: string
  endDate?: string
  location?: string
  image?: string
  category?: string
  slug?: string
  price?: number
  capacity?: number
  organizer?: any
  organizerInfo?: {
    name: string
    email: string
  }
  isActive?: boolean
  createdAt?: string
}

interface EventsResponse {
  events: Event[]
  totalEvents: number
  error: string | null
  categories?: string[]
}

// This function directly queries the database without using API routes
async function getEventsDirectly(searchParams?: {
  search?: string
  category?: string
  page?: string
}): Promise<EventsResponse> {
  try {
    console.log("Connecting to database...")
    await connectToDatabase()
    console.log("Connected to database successfully")

    // Import models here to ensure they're only loaded after DB connection
    const Event = (await import("@/models/Event")).default
    const User = (await import("@/models/User")).default

    // Build query
    const query: any = {}

    // Add search filter if provided
    if (searchParams?.search) {
      query.$or = [
        { title: { $regex: searchParams.search, $options: "i" } },
        { description: { $regex: searchParams.search, $options: "i" } },
        { location: { $regex: searchParams.search, $options: "i" } },
      ]
    }

    // Add category filter if provided
    if (searchParams?.category && searchParams.category !== "all") {
      query.category = searchParams.category
    }

    console.log("Fetching events with query:", JSON.stringify(query))

    // Get the current date for categorizing events
    const now = new Date()

    // Count total events for pagination
    const totalEvents = await Event.countDocuments(query)

    // Add pagination
    const page = Number.parseInt(searchParams?.page || "1", 10)
    const limit = 12 // 12 events per page
    const skip = (page - 1) * limit

    // Fetch all events first (without pagination) to categorize them
    const allEvents = await Event.find(query).lean().exec()

    // Categorize events
    const recentEvents: Event[] = []
    const upcomingEvents: Event[] = []
    const pastEvents: Event[] = []

    allEvents.forEach((event) => {
      const eventDate = event.date ? new Date(event.date) : null
      const eventEndDate = event.endDate ? new Date(event.endDate) : null
      const createdAt = event.createdAt ? new Date(event.createdAt) : new Date(0)

      // Recent events (created in the last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      if (createdAt >= sevenDaysAgo) {
        recentEvents.push(event)
      }
      // Upcoming events (start date is in the future)
      else if (eventDate && eventDate > now) {
        upcomingEvents.push(event)
      }
      // Past events (end date is in the past)
      else if ((eventEndDate && eventEndDate < now) || (eventDate && eventDate < now && !eventEndDate)) {
        pastEvents.push(event)
      }
      // Default to upcoming if we can't categorize
      else {
        upcomingEvents.push(event)
      }
    })

    // Sort each category
    recentEvents.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    upcomingEvents.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())
    pastEvents.sort(
      (a, b) => new Date(b.endDate || b.date || 0).getTime() - new Date(a.endDate || a.date || 0).getTime(),
    )

    // Combine all events in the desired order
    const sortedEvents = [...recentEvents, ...upcomingEvents, ...pastEvents]

    // Apply pagination to the sorted events
    const paginatedEvents = sortedEvents.slice(skip, skip + limit)

    // Get unique organizer IDs from paginated events
    const organizerIds = paginatedEvents
      .map((event) => event.organizer)
      .filter(Boolean)
      .map((id) => id.toString())

    // Fetch organizers
    let organizers = []
    if (organizerIds.length > 0) {
      console.log("Fetching organizer information...")
      organizers = await User.find({ _id: { $in: organizerIds } }, { name: 1, email: 1, profileImage: 1 })
        .lean()
        .exec()
      console.log(`Found ${organizers.length} organizers`)
    }

    // Create organizer map for quick lookup
    const organizerMap: Record<string, any> = {}
    for (const organizer of organizers) {
      organizerMap[organizer._id.toString()] = organizer
    }

    // Add organizer info to events
    const processedEvents = paginatedEvents.map((event) => {
      const eventWithOrganizer = { ...event } as Event

      if (event.organizer) {
        const organizerId = event.organizer.toString()
        eventWithOrganizer.organizerInfo = organizerMap[organizerId] || null
      }

      // Add event type for UI display
      if (recentEvents.some((e) => e._id.toString() === event._id.toString())) {
        ;(eventWithOrganizer as any).eventType = "recent"
      } else if (upcomingEvents.some((e) => e._id.toString() === event._id.toString())) {
        ;(eventWithOrganizer as any).eventType = "upcoming"
      } else {
        ;(eventWithOrganizer as any).eventType = "past"
      }

      return eventWithOrganizer
    })

    // Get distinct categories for filtering
    const categories = await Event.distinct("category")
    const validCategories = categories.filter(Boolean) // Filter out null/undefined values

    return {
      events: processedEvents,
      totalEvents,
      categories: validCategories,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching events directly:", error)
    return {
      events: [],
      totalEvents: 0,
      categories: [],
      error: error instanceof Error ? error.message : "Unknown error occurred while fetching events",
    }
  }
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: { search?: string; category?: string; page?: string }
}) {
  console.log("Rendering EventsPage component with params:", searchParams)
  const { events, totalEvents, categories, error } = await getEventsDirectly(searchParams)

  // Current page for pagination
  const currentPage = Number.parseInt(searchParams?.page || "1", 10)
  const limit = 12 // Same as in getEventsDirectly

  // Calculate total pages based on actual count
  const totalPages = Math.ceil(totalEvents / limit)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-16">
        <div className="container mx-auto py-8 px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold">Discover Events</h1>
              <p className="text-muted-foreground mt-2">
                Find and join exciting events in your area
                {totalEvents > 0 && ` (${totalEvents} events found)`}
              </p>
            </div>

            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
              <form className="flex-1 min-w-[200px]" action="/events">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    name="search"
                    placeholder="Search events..."
                    className="pl-8"
                    defaultValue={searchParams?.search || ""}
                    aria-label="Search events"
                  />
                  {/* Preserve other params */}
                  {searchParams?.category && searchParams.category !== "all" && (
                    <input type="hidden" name="category" value={searchParams.category} />
                  )}
                </div>
              </form>

              <form className="flex-1 min-w-[150px]" action="/events">
                {/* Preserve search param if it exists */}
                {searchParams?.search && <input type="hidden" name="search" value={searchParams.search} />}
                <Select name="category" defaultValue={searchParams?.category || "all"}>
                  <SelectTrigger aria-label="Filter by category">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" variant="ghost" size="sm" className="mt-2 w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
              </form>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-8">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Events</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Suspense fallback={<EventsLoading />}>
            {events && events.length > 0 ? (
              <>
                {/* Group events by type */}
                {events.some((e) => (e as any).eventType === "recent") && (
                  <div className="mb-10">
                    <h2 className="text-2xl font-semibold mb-4">Recent Events</h2>
                    <PublicEventList events={events.filter((e) => (e as any).eventType === "recent")} />
                  </div>
                )}

                {events.some((e) => (e as any).eventType === "upcoming") && (
                  <div className="mb-10">
                    <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
                    <PublicEventList events={events.filter((e) => (e as any).eventType === "upcoming")} />
                  </div>
                )}

                {events.some((e) => (e as any).eventType === "past") && (
                  <div className="mb-10">
                    <h2 className="text-2xl font-semibold mb-4">Past Events</h2>
                    <PublicEventList events={events.filter((e) => (e as any).eventType === "past")} />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <p className="text-muted-foreground">{error ? "Failed to load events." : "No events found."}</p>
                {!error && searchParams?.search && (
                  <p className="mt-2">
                    No events match your search criteria. Try adjusting your filters or{" "}
                    <Link href="/events" className="text-primary hover:underline">
                      view all events
                    </Link>
                  </p>
                )}
                {!error && !searchParams?.search && <p className="mt-2">Check back soon for new events!</p>}
              </div>
            )}
          </Suspense>

          {/* Pagination */}
          {events && events.length > 0 && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Link
                href={{
                  pathname: "/events",
                  query: {
                    ...(searchParams?.search ? { search: searchParams.search } : {}),
                    ...(searchParams?.category && searchParams.category !== "all"
                      ? { category: searchParams.category }
                      : {}),
                    page: Math.max(1, currentPage - 1),
                  },
                }}
                className={`flex items-center justify-center h-10 w-10 rounded-md border ${
                  currentPage <= 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-accent"
                }`}
                aria-disabled={currentPage <= 1}
                tabIndex={currentPage <= 1 ? -1 : undefined}
                aria-label="Previous page"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </Link>

              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>

              <Link
                href={{
                  pathname: "/events",
                  query: {
                    ...(searchParams?.search ? { search: searchParams.search } : {}),
                    ...(searchParams?.category && searchParams.category !== "all"
                      ? { category: searchParams.category }
                      : {}),
                    page: Math.min(totalPages, currentPage + 1),
                  },
                }}
                className={`flex items-center justify-center h-10 w-10 rounded-md border ${
                  currentPage >= totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-accent"
                }`}
                aria-disabled={currentPage >= totalPages}
                tabIndex={currentPage >= totalPages ? -1 : undefined}
                aria-label="Next page"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Loading state component
function EventsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="overflow-hidden border-none shadow-md h-full">
          <div className="relative aspect-video overflow-hidden">
            <Skeleton className="h-full w-full" />
          </div>
          <CardContent className="p-5">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />

            <div className="space-y-2 mt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
