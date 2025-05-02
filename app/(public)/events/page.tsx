import { Suspense } from "react"
import { PublicEventList } from "@/components/events/public-event-list"
import { Search, Filter, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EventListSkeleton } from "@/components/events/event-list-skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"

// This function runs on the server with optimized caching
async function getPublicEvents(searchParams?: { search?: string; category?: string; page?: string }) {
  try {
    // Use direct database query instead of API call to avoid potential issues
    await import("@/lib/mongodb").then((module) => module.connectToDatabase())
    const Event = (await import("@/models/Event")).default
    const User = (await import("@/models/User")).default

    // Build the query
    const query: any = {
      isActive: true, // Only show active events
    }

    // Add category filter if provided
    if (searchParams?.category && searchParams.category !== "all") {
      query.category = searchParams.category
    }

    // Add search filter if provided
    if (searchParams?.search) {
      query.$or = [
        { title: { $regex: searchParams.search, $options: "i" } },
        { description: { $regex: searchParams.search, $options: "i" } },
        { location: { $regex: searchParams.search, $options: "i" } },
      ]
    }

    // Get the current date
    const now = new Date()

    // Add pagination
    const page = Number.parseInt(searchParams?.page || "1", 10)
    const limit = 12 // 12 events per page
    const skip = (page - 1) * limit

    // Count total documents for pagination
    const totalEvents = await Event.countDocuments(query)

    // Fetch events
    const events = await Event.find(query)
      .sort({ date: 1 }) // Sort by date ascending
      .skip(skip)
      .limit(limit)
      .lean()

    // Get unique organizer IDs
    const organizerIds = [...new Set(events.map((event: any) => event.organizer).filter(Boolean))]

    // Fetch organizers in a single query
    const organizers = organizerIds.length
      ? await User.find({ _id: { $in: organizerIds } }, { name: 1, email: 1 }).lean()
      : []

    // Create a map for quick lookup
    const organizerMap = organizers.reduce(
      (map: Record<string, any>, user: any) => {
        map[user._id.toString()] = user
        return map
      },
      {} as Record<string, any>,
    )

    // Categorize events
    const upcomingEvents: any[] = []
    const runningEvents: any[] = []
    const pastEvents: any[] = []

    for (const event of events) {
      // Add organizer info
      if (event.organizer) {
        const organizerId = event.organizer.toString()
        event.organizerInfo = organizerMap[organizerId] || null
      }

      try {
        const eventDate = event.date ? new Date(event.date) : null
        const eventEndDate = event.endDate ? new Date(event.endDate) : null

        // If no dates are provided, consider it an upcoming event
        if (!eventDate) {
          upcomingEvents.push(event)
          continue
        }

        // Check if the event is running (started but not ended)
        if (eventDate <= now && (!eventEndDate || eventEndDate >= now)) {
          runningEvents.push(event)
          continue
        }

        // Check if the event is past (ended)
        if ((eventEndDate && eventEndDate < now) || (eventDate < now && !eventEndDate)) {
          pastEvents.push(event)
          continue
        }

        // Otherwise, it's an upcoming event
        upcomingEvents.push(event)
      } catch (error) {
        console.error(`Error processing event ${event._id}:`, error)
        // If there's an error processing dates, consider it an upcoming event
        upcomingEvents.push(event)
      }
    }

    return {
      upcomingEvents,
      runningEvents,
      pastEvents,
      pagination: {
        total: totalEvents,
        page,
        limit,
        pages: Math.ceil(totalEvents / limit),
      },
    }
  } catch (error) {
    console.error("Error fetching public events:", error)
    return {
      upcomingEvents: [],
      runningEvents: [],
      pastEvents: [],
      pagination: { total: 0, page: 1, limit: 12, pages: 1 },
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// Get categories with longer cache time since they change less frequently
async function getCategories() {
  try {
    await import("@/lib/mongodb").then((module) => module.connectToDatabase())
    const Event = (await import("@/models/Event")).default

    // Get distinct categories
    const categories = await Event.distinct("category")
    return categories.filter(Boolean) // Filter out null/undefined values
  } catch (error) {
    console.error("Error fetching categories:", error)
    return ["Conference", "Workshop", "Meetup", "Webinar", "Other"] // Fallback categories
  }
}

export default async function PublicEventsPage({
  searchParams,
}: {
  searchParams?: { search?: string; category?: string; page?: string }
}) {
  // Fetch data in parallel for better performance
  const [eventsData, categories] = await Promise.all([getPublicEvents(searchParams), getCategories()])

  const { upcomingEvents = [], runningEvents = [], pastEvents = [], pagination, error } = eventsData

  // Current page for pagination
  const currentPage = Number.parseInt(searchParams?.page || "1", 10)

  return (
    <div className="pt-16">
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Discover Events</h1>
            <p className="text-muted-foreground mt-2">Find and join exciting events in your area</p>
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
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category: string) => (
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

        {/* Upcoming Events Section */}
        <section aria-labelledby="upcoming-events-heading" className="mb-12">
          <h2 id="upcoming-events-heading" className="text-2xl font-bold mt-8">
            Upcoming Events
          </h2>
          <div className="mt-6">
            <Suspense fallback={<EventsLoading />}>
              {upcomingEvents.length > 0 ? (
                <PublicEventList events={upcomingEvents} />
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No upcoming events found.</p>
                  {searchParams?.search || searchParams?.category ? (
                    <p className="mt-2">
                      Try adjusting your search filters or{" "}
                      <a href="/events" className="text-primary hover:underline">
                        view all events
                      </a>
                    </p>
                  ) : (
                    <p className="mt-2">Check back soon for new events!</p>
                  )}
                </div>
              )}
            </Suspense>
          </div>
        </section>

        {/* Running Events Section */}
        <section aria-labelledby="running-events-heading" className="mb-12">
          <h2 id="running-events-heading" className="text-2xl font-bold mt-8">
            Running Events
          </h2>
          <div className="mt-6">
            <Suspense fallback={<EventsLoading />}>
              {runningEvents.length > 0 ? (
                <PublicEventList events={runningEvents} />
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No running events found.</p>
                </div>
              )}
            </Suspense>
          </div>
        </section>

        {/* Past Events Section */}
        <section aria-labelledby="past-events-heading" className="mb-12">
          <h2 id="past-events-heading" className="text-2xl font-bold mt-8">
            Past Events
          </h2>
          <div className="mt-6">
            <Suspense fallback={<EventsLoading />}>
              {pastEvents.length > 0 ? (
                <PublicEventList events={pastEvents} />
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No past events found.</p>
                </div>
              )}
            </Suspense>
          </div>
        </section>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
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
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Link>

            <span className="text-sm">
              Page {currentPage} of {pagination.pages}
            </span>

            <Link
              href={{
                pathname: "/events",
                query: {
                  ...(searchParams?.search ? { search: searchParams.search } : {}),
                  ...(searchParams?.category && searchParams.category !== "all"
                    ? { category: searchParams.category }
                    : {}),
                  page: Math.min(pagination.pages, currentPage + 1),
                },
              }}
              className={`flex items-center justify-center h-10 w-10 rounded-md border ${
                currentPage >= pagination.pages ? "opacity-50 cursor-not-allowed" : "hover:bg-accent"
              }`}
              aria-disabled={currentPage >= pagination.pages}
              tabIndex={currentPage >= pagination.pages ? -1 : undefined}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function EventsLoading() {
  return (
    <div className="py-4">
      <EventListSkeleton />
    </div>
  )
}
