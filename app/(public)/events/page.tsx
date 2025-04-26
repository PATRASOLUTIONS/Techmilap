import { Suspense } from "react"
import { PublicEventList } from "@/components/events/public-event-list"
import { PastEventsSection } from "@/components/events/past-events-section"
import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EventListSkeleton } from "@/components/events/event-list-skeleton"

// This function runs on the server with optimized caching
async function getPublicEvents(searchParams?: { search?: string; category?: string; past?: boolean }) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    let url = `${baseUrl}/api/events/public`

    // Add query parameters if provided
    const params = new URLSearchParams()
    if (searchParams?.search) params.append("search", searchParams.search)
    if (searchParams?.category && searchParams.category !== "all") params.append("category", searchParams.category)
    if (searchParams?.past) params.append("past", searchParams.past.toString())

    // Add debug parameter for development
    if (process.env.NODE_ENV === "development") {
      params.append("debug", "true")
    }

    if (params.toString()) {
      url += `?${params.toString()}`
    }

    // Use different caching strategies based on the type of data
    // Past events can be cached longer than upcoming events
    const cacheOptions = {
      next: {
        revalidate: searchParams?.past ? 3600 : 300, // Cache past events for 1 hour, upcoming for 5 minutes
      },
    }

    const response = await fetch(url, cacheOptions)

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

// Get categories with longer cache time since they change less frequently
async function getCategories() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const response = await fetch(`${baseUrl}/api/events/categories`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    }).then((res) => res.json())

    return response.categories || []
  } catch (error) {
    console.error("Error fetching categories:", error)
    return ["Conference", "Workshop", "Meetup", "Webinar", "Other"] // Fallback categories
  }
}

export default async function PublicEventsPage({
  searchParams,
}: {
  searchParams?: { search?: string; category?: string; past?: boolean }
}) {
  // Fetch data in parallel for better performance
  const [upcomingEventsPromise, pastEventsPromise, categoriesPromise] = await Promise.allSettled([
    getPublicEvents({ ...searchParams, past: false }),
    getPublicEvents({ ...searchParams, past: true }),
    getCategories(),
  ])

  // Handle the results safely
  const upcomingEvents = upcomingEventsPromise.status === "fulfilled" ? upcomingEventsPromise.value : []
  const pastEvents = pastEventsPromise.status === "fulfilled" ? pastEventsPromise.value : []
  const categories =
    categoriesPromise.status === "fulfilled"
      ? categoriesPromise.value
      : ["Conference", "Workshop", "Meetup", "Webinar", "Other"]

  const now = new Date()

  // Filter events only once
  const runningEvents = upcomingEvents.filter((event) => new Date(event.date) <= now && new Date(event.endDate) >= now)

  const futureEvents = upcomingEvents.filter((event) => new Date(event.date) > now)

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

        {/* Upcoming Events Section */}
        <section aria-labelledby="upcoming-events-heading" className="mb-12">
          <h2 id="upcoming-events-heading" className="text-2xl font-bold mt-8">
            Upcoming Events
          </h2>
          <Suspense fallback={<EventsLoading />}>
            {futureEvents.length > 0 ? (
              <PublicEventList events={futureEvents} />
            ) : (
              <div className="text-center py-12">No upcoming events found.</div>
            )}
          </Suspense>
        </section>

        {/* Running Events Section */}
        <section aria-labelledby="running-events-heading" className="mb-12">
          <h2 id="running-events-heading" className="text-2xl font-bold mt-8">
            Running Events
          </h2>
          <Suspense fallback={<EventsLoading />}>
            {runningEvents.length > 0 ? (
              <PublicEventList events={runningEvents} />
            ) : (
              <div className="text-center py-12">No running events found.</div>
            )}
          </Suspense>
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
