import { Suspense } from "react"
import { PublicEventList } from "@/components/events/public-event-list"
import { PastEventsSection } from "@/components/events/past-events-section"
import { Search, Filter, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EventListSkeleton } from "@/components/events/event-list-skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// This function runs on the server with optimized caching
async function getPublicEvents(searchParams?: { search?: string; category?: string }) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    let url = `${baseUrl}/api/events/public`

    // Add query parameters if provided
    const params = new URLSearchParams()
    if (searchParams?.search) params.append("search", searchParams.search)
    if (searchParams?.category && searchParams.category !== "all") params.append("category", searchParams.category)

    // Add debug parameter for development
    if (process.env.NODE_ENV === "development") {
      params.append("debug", "true")
    }

    if (params.toString()) {
      url += `?${params.toString()}`
    }

    console.log("Fetching events from:", url)

    // Use different caching strategies based on the type of data
    const cacheOptions = {
      next: {
        revalidate: 60, // Cache for 1 minute in development to see changes faster
      },
    }

    const response = await fetch(url, cacheOptions)

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.status}`)
    }

    const data = await response.json()

    console.log(
      `Fetched ${data.events?.length || 0} events, ${data.upcomingEvents?.length || 0} upcoming, ${data.runningEvents?.length || 0} running, ${data.pastEvents?.length || 0} past`,
    )

    // If we have debug info, log it
    if (data.debug) {
      console.log("Debug info:", data.debug)
    }

    return {
      events: data.events || [],
      upcomingEvents: data.upcomingEvents || [],
      runningEvents: data.runningEvents || [],
      pastEvents: data.pastEvents || [],
      pagination: data.pagination,
      debug: data.debug,
    }
  } catch (error) {
    console.error("Error fetching public events:", error)
    return {
      events: [],
      upcomingEvents: [],
      runningEvents: [],
      pastEvents: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// Get categories with longer cache time since they change less frequently
async function getCategories() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const response = await fetch(`${baseUrl}/api/events/categories`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`)
    }

    const data = await response.json()
    return data.categories || []
  } catch (error) {
    console.error("Error fetching categories:", error)
    return ["Conference", "Workshop", "Meetup", "Webinar", "Other"] // Fallback categories
  }
}

export default async function PublicEventsPage({
  searchParams,
}: {
  searchParams?: { search?: string; category?: string }
}) {
  // Fetch data in parallel for better performance
  const [eventsData, categories] = await Promise.all([getPublicEvents(searchParams), getCategories()])

  const { upcomingEvents = [], runningEvents = [], pastEvents = [], error, debug } = eventsData

  // For development, show some debug info
  const showDebug = process.env.NODE_ENV === "development" && debug

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
                  {categories.map((category) => (
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

        {/* Debug info for development */}
        {showDebug && (
          <div className="bg-slate-100 p-4 rounded-md mb-8 text-sm">
            <h3 className="font-semibold mb-2">Debug Information</h3>
            <pre className="whitespace-pre-wrap">{JSON.stringify(debug, null, 2)}</pre>
          </div>
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
        <section aria-labelledby="past-events-heading">
          <Suspense fallback={<EventsLoading />}>
            {pastEvents.length > 0 && <PastEventsSection events={pastEvents} />}
          </Suspense>
        </section>
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
