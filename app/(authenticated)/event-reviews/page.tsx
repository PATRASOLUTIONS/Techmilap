"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Search, Filter, ArrowUpDown, BarChart } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReviewList } from "@/components/reviews/review-list"
import { ReviewStats } from "@/components/reviews/review-stats"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function EventReviewsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [reviews, setReviews] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    ratings: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
  })

  // Filters
  const [selectedEvent, setSelectedEvent] = useState("all")
  const [selectedRating, setSelectedRating] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentTab, setCurrentTab] = useState("all")
  const [sortBy, setSortBy] = useState("date") // "date", "rating-high", "rating-low"

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [limit] = useState(10)

  // Debug state
  const [error, setError] = useState<string | null>(null)
  const [debug, setDebug] = useState<any>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    // Only proceed if the user is an event planner
    if (session?.user?.role === "event-planner" || session?.user?.role === "super-admin") {
      fetchEvents()
      fetchReviews()
    } else {
      // If not an event planner, show an error
      setError("You must be an event organizer to view event reviews.")
      setLoading(false)
    }
  }, [session, status, router, page, selectedEvent, selectedRating, selectedStatus, searchQuery, currentTab, sortBy])

  const fetchEvents = async () => {
    console.log("Fetching events for organizer:", session?.user?.id)
    try {
      // For event planners, fetch their events
      const response = await fetch("/api/events/my-events/all")

      if (!response.ok) {
        console.error("Error fetching events:", response.status, await response.text())
        throw new Error("Failed to fetch events")
      }

      const data = await response.json()
      console.log("Fetched events:", data.events?.length || 0, "events")
      setEvents(data.events || [])

      // If there are events but no selected event, set the first one
      if (data.events?.length > 0 && selectedEvent === "all") {
        // Keep "all" as default
      }
    } catch (error) {
      console.error("Error fetching events:", error)
      setError("Failed to load events. Please try again.")
      toast({
        title: "Error",
        description: "Failed to load events. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchReviews = async () => {
    setLoading(true)
    setError(null)
    console.log("Fetching reviews with filters:", {
      page,
      limit,
      event: selectedEvent,
      rating: selectedRating,
      status: selectedStatus,
      search: searchQuery,
      tab: currentTab,
      sort: sortBy,
    })

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(selectedEvent !== "all" && { eventId: selectedEvent }),
        ...(selectedRating !== "all" && { rating: selectedRating }),
        ...(selectedStatus !== "all" && { status: selectedStatus }),
        ...(searchQuery && { search: searchQuery }),
        ...(currentTab !== "all" && { tab: currentTab }),
        sort: sortBy,
      })

      // Use the planner endpoint to get reviews for events organized by the user
      const endpoint = `/api/reviews/planner?${queryParams.toString()}`

      console.log("Fetching reviews from:", endpoint)
      const response = await fetch(endpoint)

      if (!response.ok) {
        console.error("Error fetching reviews:", response.status, await response.text())
        const errorText = await response.text()
        try {
          const errorJson = JSON.parse(errorText)
          setDebug(errorJson)
        } catch (e) {
          setDebug({ errorText })
        }
        throw new Error("Failed to fetch reviews")
      }

      const data = await response.json()
      console.log("Fetched reviews:", data.reviews?.length || 0, "reviews")

      console.log("API Response:", {
        totalReviews: data.reviews?.length || 0,
        totalPages: data.totalPages || 0,
        stats: data.stats || {},
        firstReview: data.reviews?.[0]
          ? {
              id: data.reviews[0]._id,
              eventId: data.reviews[0].eventId,
              eventTitle: data.reviews[0].event?.title || "Unknown",
              rating: data.reviews[0].rating,
              status: data.reviews[0].status,
            }
          : "No reviews",
      })

      if (data.reviews?.length > 0) {
        console.log("Sample review:", JSON.stringify(data.reviews[0], null, 2).substring(0, 200) + "...")
      }

      setReviews(data.reviews || [])
      setTotalPages(data.totalPages || 1)
      setStats(
        data.stats || {
          total: 0,
          average: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          ratings: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
          },
        },
      )
    } catch (error) {
      console.error("Error fetching reviews:", error)
      setError("Failed to load reviews. Please try again.")
      toast({
        title: "Error",
        description: "Failed to load reviews. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async (id, text) => {
    try {
      console.log("Submitting reply for review:", id, "Text:", text)
      const response = await fetch(`/api/reviews/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error reply response:", errorData)
        throw new Error(errorData.error || "Failed to reply to review")
      }

      toast({
        title: "Success",
        description: "Reply posted successfully",
      })

      // Update the review in the list
      setReviews(
        reviews.map((review) =>
          review._id === id ? { ...review, reply: { text, createdAt: new Date().toISOString() } } : review,
        ),
      )
    } catch (error) {
      console.error("Error replying to review:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to post reply. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleApprove = async (id) => {
    try {
      console.log("Approving review:", id)
      const response = await fetch(`/api/reviews/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error approval response:", errorData)
        throw new Error(errorData.error || "Failed to approve review")
      }

      toast({
        title: "Success",
        description: "Review approved successfully",
      })

      // Update the review in the list
      setReviews(reviews.map((review) => (review._id === id ? { ...review, status: "approved" } : review)))

      // Update stats
      setStats((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        approved: prev.approved + 1,
      }))
    } catch (error) {
      console.error("Error approving review:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to approve review. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleReject = async (id) => {
    try {
      console.log("Rejecting review:", id)
      const response = await fetch(`/api/reviews/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error rejection response:", errorData)
        throw new Error(errorData.error || "Failed to reject review")
      }

      toast({
        title: "Success",
        description: "Review rejected successfully",
      })

      // Update the review in the list
      setReviews(reviews.map((review) => (review._id === id ? { ...review, status: "rejected" } : review)))

      // Update stats
      setStats((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        rejected: prev.rejected + 1,
      }))
    } catch (error) {
      console.error("Error rejecting review:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to reject review. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleDelete = async (id) => {
    try {
      console.log("Deleting review:", id)
      const response = await fetch(`/api/reviews/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error deletion response:", errorData)
        throw new Error(errorData.error || "Failed to delete review")
      }

      toast({
        title: "Success",
        description: "Review deleted successfully",
      })

      // Remove the review from the list
      setReviews(reviews.filter((review) => review._id !== id))

      // Update stats
      setStats((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }))
    } catch (error) {
      console.error("Error deleting review:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete review. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const getSortButtonText = () => {
    switch (sortBy) {
      case "rating-high":
        return "Highest Rating"
      case "rating-low":
        return "Lowest Rating"
      case "date":
      default:
        return "Most Recent"
    }
  }

  if (status === "loading") {
    return (
      <div className="container mx-auto py-10">
        <Skeleton className="h-12 w-1/3 mb-6" />
        <div className="grid gap-6">
          <Skeleton className="h-[200px] w-full" />
          <div className="grid gap-4">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-[120px] w-full" />
              ))}
          </div>
        </div>
      </div>
    )
  }

  // Check if the user is an event planner
  if (session?.user?.role !== "event-planner" && session?.user?.role !== "super-admin") {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You must be an event organizer to view event reviews. Please contact your administrator if you believe this
            is an error.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Reviews</h1>
          <p className="text-muted-foreground">Manage and respond to reviews for all your events</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Review Statistics</CardTitle>
            <CardDescription>Overview of all reviews for your events</CardDescription>
          </CardHeader>
          <CardContent>
            <ReviewStats stats={stats} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5 text-muted-foreground" />
              Filters
            </CardTitle>
            <CardDescription>Filter reviews by event, rating, or status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    {events.map((event) => (
                      <SelectItem key={event._id} value={event._id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={selectedRating} onValueChange={setSelectedRating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <SelectItem key={rating} value={rating.toString()}>
                        {rating} {rating === 1 ? "Star" : "Stars"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Sort button */}
            <div className="mt-4 flex justify-end">
              <div className="relative">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <div className="flex items-center">
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Sort by" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Most Recent</SelectItem>
                    <SelectItem value="rating-high">Highest Rating</SelectItem>
                    <SelectItem value="rating-low">Lowest Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {debug && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative mb-6">
            <pre className="text-xs overflow-auto">{JSON.stringify(debug, null, 2)}</pre>
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab}>
              <TabsList>
                <TabsTrigger value="all">
                  All Reviews
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{stats.total}</span>
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{stats.pending}</span>
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Approved
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{stats.approved}</span>
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{stats.rejected}</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className="h-[200px] w-full" />
                  ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8">
                <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-lg font-semibold">No Reviews Found</h3>
                <p className="text-muted-foreground">There are no reviews for your events yet.</p>
              </div>
            ) : (
              <ReviewList
                reviews={reviews}
                loading={loading}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                onReply={handleReply}
                onApprove={handleApprove}
                onReject={handleReject}
                onDelete={handleDelete}
                showEventDetails={true}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
