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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Use the new API endpoint
    let url = `${baseUrl}/api/public-events`

    // Add query parameters if provided
    const params = new URLSearchParams()
    if (searchParams?.search) params.append("search", searchParams.search)
    if (searchParams?.category && searchParams.category !== "all") params.append("category", searchParams.category)

    // Add pagination
    const page = Number.parseInt(searchParams?.page || "1", 10)
    params.append("page", page.toString())
    params.append("limit", "12") // 12 events per page

    if (params.toString()) {
      url += `?${params.toString()}`
    }

    console.log("Fetching events from:", url)

    // Use different caching strategies based on the type of data
    const cacheOptions = {
      next: {
        revalidate: 60, // Cache for 1 minute to see changes faster
      },
    }

    const response = await fetch(url, cacheOptions)

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.status}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch events")
    }

    console.log(
      `Fetched ${data.upcomingEvents?.length || 0} upcoming, ${data.runningEvents?.length || 0} running, ${data.pastEvents?.length || 0} past events`,
    )

    return {
      upcomingEvents: data.upcomingEvents || [],
      runningEvents: data.runningEvents || [],
      pastEvents: data.pastEvents || [],
      pagination: data.pagination || { total: 0, page: 1, limit: 12, pages: 1 },
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
