import { Suspense } from "react"
import { PublicEventList } from "@/components/events/public-event-list"
import { PastEventsSection } from "@/components/events/past-events-section"
import { Loader2, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// This function runs on the server
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

    console.log("Fetching events from:", url)

    const response = await fetch(url, {
      cache: "no-store",
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Received ${data.events?.length || 0} events from API`)
    return data.events || []
  } catch (error) {
    console.error("Error fetching public events:", error)
    return []
  }
}

// Get categories for filter dropdown
async function getCategories() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const response = await fetch(`${baseUrl}/api/events/categories`, {
      cache: "no-store",
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
  const upcomingEvents = await getPublicEvents({ ...searchParams, past: false })
  const pastEvents = await getPublicEvents({ ...searchParams, past: true })
  const categories = await getCategories().catch(() => ["Conference", "Workshop", "Meetup", "Webinar", "Other"])
  const runningEvents = await getPublicEvents({ ...searchParams, past: false })

  const now = new Date()

  return (
    <div className="pt-16">
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 ">
          <div>
            <h1 className="text-3xl font-bold">Discover Events</h1>
            <p className="text-muted-foreground mt-2">Find and join exciting events in your area</p>
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <form className="flex-1 min-w-[200px]" action="/explore">
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
        <h2 className="text-2xl font-bold mt-8">Upcoming Events</h2>
        <Suspense fallback={<EventsLoading />}>
          {upcomingEvents.length > 0 ? (
            <PublicEventList events={upcomingEvents.filter((event) => new Date(event.date) > now)} />
          ) : (
            <div className="text-center py-12">No upcoming events found.</div>
          )}
        </Suspense>

        {/* Running Events Section */}
        <h2 className="text-2xl font-bold mt-8">Running Events</h2>
        <Suspense fallback={<EventsLoading />}>
          {runningEvents.length > 0 ? (
            <PublicEventList
              events={runningEvents.filter((event) => new Date(event.date) <= now && new Date(event.endDate) >= now)}
            />
          ) : (
            <div className="text-center py-12">No running events found.</div>
          )}
        </Suspense>

        <Suspense fallback={<EventsLoading />}>
          {pastEvents.length > 0 && <PastEventsSection events={pastEvents} />}
        </Suspense>
      </div>
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
