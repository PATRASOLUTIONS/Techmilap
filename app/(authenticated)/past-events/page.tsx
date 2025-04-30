"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Calendar, Users, MapPin, Search, ChevronLeft, ChevronRight, History, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Event {
  _id: string
  title: string
  date: string
  endDate?: string
  location: string
  capacity: number
  status: "draft" | "published" | "cancelled" | "completed" | "active"
  attendees?: string[] | any[]
  slug?: string
  userRole?: "organizer" | "attendee" | "volunteer" | "speaker"
}

interface PaginationInfo {
  total: number
  page: number
  limit: number
  pages: number
}

export default function PastEventsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  })
  const [sortBy, setSortBy] = useState("date-desc")
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchPastEvents = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/events/past?page=${pagination.page}&limit=${pagination.limit}`, {
          cache: "no-store",
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage =
            errorData.error || `Failed to fetch past events (${response.status} ${response.statusText})`
          throw new Error(errorMessage)
        }

        const data = await response.json()

        // Ensure we have an array of events, even if empty
        const eventsList = Array.isArray(data.events) ? data.events : []

        // Update pagination info
        if (data.pagination) {
          setPagination(data.pagination)
        }

        setEvents(eventsList)
      } catch (error) {
        console.error("Error fetching past events:", error)
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load past events. Please try again later."

        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPastEvents()
  }, [toast, pagination.page, pagination.limit])

  // Filter events based on search term
  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleEventClick = (eventId: string, eventSlug?: string) => {
    if (!eventId) return
    const eventUrl = eventSlug || eventId
    router.push(`/my-events/details/${eventUrl}`)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.pages) return
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    // In a real implementation, you would refetch with the new sort parameter
    // For now, we'll just sort the current events
    const sortedEvents = [...events]
    switch (value) {
      case "date-desc":
        sortedEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        break
      case "date-asc":
        sortedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        break
      case "title-asc":
        sortedEvents.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "title-desc":
        sortedEvents.sort((a, b) => b.title.localeCompare(a.title))
        break
    }
    setEvents(sortedEvents)
  }

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Past Events</h1>
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <History className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium">Error Loading Events</h3>
          <p className="text-muted-foreground mt-2 max-w-md">{error}</p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Past Events</h1>
        <p className="text-muted-foreground">Browse through all your past events and activities.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-auto flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search past events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8"
            />
          </div>
        </div>
        <div className="w-full md:w-auto flex gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="title-asc">Title (A-Z)</SelectItem>
              <SelectItem value="title-desc">Title (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <EventsLoadingSkeleton />
      ) : filteredEvents.length > 0 ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard key={event._id} event={event} onClick={() => handleEventClick(event._id, event.slug)} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    // Show pages around the current page
                    let pageToShow
                    if (pagination.pages <= 5) {
                      pageToShow = i + 1
                    } else if (pagination.page <= 3) {
                      pageToShow = i + 1
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageToShow = pagination.pages - 4 + i
                    } else {
                      pageToShow = pagination.page - 2 + i
                    }

                    return (
                      <Button
                        key={pageToShow}
                        variant={pagination.page === pageToShow ? "default" : "outline"}
                        size="icon"
                        onClick={() => handlePageChange(pageToShow)}
                        className="w-8 h-8"
                      >
                        {pageToShow}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <History className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No past events found</h3>
          <p className="text-muted-foreground mt-2 max-w-md">
            You don't have any past events yet. Events will appear here after their scheduled date has passed.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/explore">Explore Upcoming Events</Link>
          </Button>
        </div>
      )}
    </div>
  )
}

function EventsLoadingSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="space-y-2 mt-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-9 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

function EventCard({ event, onClick }: { event: Event; onClick: () => void }) {
  const startDate = new Date(event.date)
  const endDate = event.endDate ? new Date(event.endDate) : null
  const formattedStartDate = startDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const formattedEndDate = endDate?.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <Card className="cursor-pointer" onClick={onClick}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{event.title}</CardTitle>
          <Badge
            variant="secondary"
            className={
              event.status === "cancelled"
                ? "bg-red-500 text-white"
                : event.status === "completed"
                  ? "bg-green-500 text-white"
                  : "bg-gray-300 text-gray-700"
            }
          >
            {event.status}
          </Badge>
        </div>
        <CardDescription>
          {formattedStartDate}
          {formattedEndDate && ` - ${formattedEndDate}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{event.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{event.attendees?.length || 0} Attendees</span>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground justify-between">
        <span>{event.userRole ? `Your Role: ${event.userRole}` : "No Role Assigned"}</span>
        <span>
          <Calendar className="mr-1 inline-block h-4 w-4" />
          {formattedStartDate}
        </span>
      </CardFooter>
    </Card>
  )
}
