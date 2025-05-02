import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPinIcon, Clock, Users, AlertCircle, Search, Filter } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"

// This function fetches events from the public API
async function getEvents(searchParams?: { search?: string; category?: string; page?: string }) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Build the URL with query parameters
    let url = `${baseUrl}/api/public/events`
    const params = new URLSearchParams()

    if (searchParams?.search) {
      params.append("search", searchParams.search)
    }

    if (searchParams?.category && searchParams.category !== "all") {
      params.append("category", searchParams.category)
    }

    // Add pagination
    const page = Number.parseInt(searchParams?.page || "1", 10)
    params.append("page", page.toString())
    params.append("limit", "12") // 12 events per page

    if (params.toString()) {
      url += `?${params.toString()}`
    }

    console.log("Fetching events from public API:", url)

    const response = await fetch(url, {
      next: { revalidate: 60 }, // Cache for 1 minute
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      console.error("API response not OK:", response.status, response.statusText)
      // Log the response body for debugging
      const text = await response.text()
      console.error("Response body:", text)
      throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch events")
    }

    console.log(`Fetched ${data.events?.length || 0} events from public API`)

    return {
      events: data.events || [],
      pagination: data.pagination || { total: 0, page: 1, limit: 12, pages: 1 },
      error: null,
    }
  } catch (error) {
    console.error("Error fetching events from public API:", error)
    return {
      events: [],
      pagination: { total: 0, page: 1, limit: 12, pages: 1 },
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// Get categories
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

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: { search?: string; category?: string; page?: string }
}) {
  // Fetch data in parallel for better performance
  const [eventsData, categories] = await Promise.all([getEvents(searchParams), getCategories()])

  const { events, pagination, error } = eventsData

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

        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event._id.toString()} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{error ? "Failed to load events." : "No events found."}</p>
            {!error && <p className="mt-2">Check back soon for new events!</p>}
          </div>
        )}

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
              <span className="sr-only">Previous page</span>
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
              <span className="sr-only">Next page</span>
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
  )
}

// Simple event card component defined directly in the page to avoid import issues
function EventCard({ event }: { event: any }) {
  // Handle potential missing or invalid date
  let formattedDate = "Date TBA"
  let formattedTime = "Time TBA"

  try {
    if (event.date) {
      const eventDate = new Date(event.date)
      if (!isNaN(eventDate.getTime())) {
        formattedDate = format(eventDate, "EEEE, MMMM d, yyyy")
        formattedTime = format(eventDate, "h:mm a")
      }
    }
  } catch (error) {
    console.error(`Error formatting date for event ${event._id}:`, error)
  }

  const eventId = event.slug || event._id

  return (
    <Link href={`/events/${eventId}`} className="group">
      <Card className="overflow-hidden border-none shadow-md transition-all duration-200 hover:shadow-lg h-full">
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={event.image || "/placeholder.svg?height=400&width=600&query=tech+event"}
            alt={event.title}
            width={600}
            height={400}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {event.category && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-primary/90 hover:bg-primary text-white">{event.category}</Badge>
            </div>
          )}
        </div>
        <CardContent className="p-5">
          <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>

          <div className="space-y-2 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{formattedTime}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}
            {event.organizerInfo?.name && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="line-clamp-1">By {event.organizerInfo.name}</span>
              </div>
            )}
          </div>

          {event.price !== undefined && (
            <div className="mt-4">
              <Badge variant="outline" className="text-primary border-primary">
                {event.price === 0 ? "Free" : `$${event.price}`}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
