import { Suspense } from "react"
import { connectToDatabase } from "@/lib/mongodb"
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
import { Skeleton } from "@/components/ui/skeleton"

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
}

interface Organizer {
  _id: string
  name: string
  email: string
  profileImage?: string
}

interface EventsResponse {
  events: Event[]
  error: string | null
  categories?: string[]
}

// This function directly queries the database without using API routes
// to avoid any potential issues with API responses
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
    const query: any = { isActive: true }

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

    // Add pagination
    const page = Number.parseInt(searchParams?.page || "1", 10)
    const limit = 12 // 12 events per page
    const skip = (page - 1) * limit

    // Fetch events with pagination
    const events = await Event.find(query)
      .sort({ date: 1 }) // Sort by date ascending
      .skip(skip)
      .limit(limit)
      .lean()
      .exec()

    console.log(`Found ${events.length} events in database`)

    // Get unique organizer IDs
    const organizerIds = events
      .map((event) => event.organizer)
      .filter(Boolean)
      .map((id) => id.toString())

    // Fetch organizers
    let organizers: Organizer[] = []
    if (organizerIds.length > 0) {
      console.log("Fetching organizer information...")
      organizers = await User.find({ _id: { $in: organizerIds } }, { name: 1, email: 1, profileImage: 1 })
        .lean()
        .exec()
      console.log(`Found ${organizers.length} organizers`)
    }

    // Create organizer map for quick lookup
    const organizerMap: Record<string, Organizer> = {}
    for (const organizer of organizers) {
      organizerMap[organizer._id.toString()] = organizer
    }

    // Add organizer info to events
    const processedEvents = events.map((event) => {
      const eventWithOrganizer = { ...event } as Event

      if (event.organizer) {
        const organizerId = event.organizer.toString()
        eventWithOrganizer.organizerInfo = organizerMap[organizerId] || null
      }

      return eventWithOrganizer
    })

    // Get distinct categories for filtering
    const categories = await Event.distinct("category")
    const validCategories = categories.filter(Boolean) // Filter out null/undefined values

    return {
      events: processedEvents,
      categories: validCategories,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching events directly:", error)
    return {
      events: [],
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
  const { events, categories, error } = await getEventsDirectly(searchParams)

  // Current page for pagination
  const currentPage = Number.parseInt(searchParams?.page || "1", 10)

  // Calculate total pages - this is a placeholder since we don't have the total count
  // In a real implementation, you would fetch the total count from the database
  const totalPages = 5 // Placeholder

  return (
    <div className="min-h-screen bg-gray-50">
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
            {events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <EventCard key={event._id.toString()} event={event} />
                ))}
              </div>
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
          {events.length > 0 && totalPages > 1 && (
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

// Event card component with proper type safety
function EventCard({ event }: { event: Event }) {
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
            priority={false}
            loading="lazy"
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
