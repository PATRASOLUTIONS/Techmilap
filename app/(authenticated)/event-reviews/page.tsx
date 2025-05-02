"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReviewList } from "@/components/reviews/review-list"
import { ReviewStats } from "@/components/reviews/review-stats"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

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
  })

  // Filters
  const [selectedEvent, setSelectedEvent] = useState("all")
  const [selectedRating, setSelectedRating] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentTab, setCurrentTab] = useState("all")

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [limit] = useState(10)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (session?.user?.role !== "event-planner" && session?.user?.role !== "super-admin") {
      router.push("/user-dashboard")
      return
    }

    fetchEvents()
    fetchReviews()
  }, [session, status, router, page, selectedEvent, selectedRating, selectedStatus, searchQuery, currentTab])

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events/my-events/all")
      if (!response.ok) throw new Error("Failed to fetch events")

      const data = await response.json()
      setEvents(data.events || [])
    } catch (error) {
      console.error("Error fetching events:", error)
      toast({
        title: "Error",
        description: "Failed to load events. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(selectedEvent !== "all" && { eventId: selectedEvent }),
        ...(selectedRating !== "all" && { rating: selectedRating }),
        ...(selectedStatus !== "all" && { status: selectedStatus }),
        ...(searchQuery && { search: searchQuery }),
        ...(currentTab !== "all" && { tab: currentTab }),
      })

      const response = await fetch(`/api/reviews/planner?${queryParams.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch reviews")

      const data = await response.json()
      setReviews(data.reviews || [])
      setTotalPages(data.totalPages || 1)
      setStats(
        data.stats || {
          total: 0,
          average: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
        },
      )
    } catch (error) {
      console.error("Error fetching reviews:", error)
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
      const response = await fetch(`/api/reviews/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) throw new Error("Failed to reply to review")

      toast({
        title: "Success",
        description: "Reply posted successfully",
      })

      // Update the review in the list
      setReviews(
        reviews.map((review) =>
          review._id === id ? { ...review, reply: text, replyDate: new Date().toISOString() } : review,
        ),
      )
    } catch (error) {
      console.error("Error replying to review:", error)
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleApprove = async (id) => {
    try {
      const response = await fetch(`/api/reviews/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      })

      if (!response.ok) throw new Error("Failed to approve review")

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
        description: "Failed to approve review. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleReject = async (id) => {
    try {
      const response = await fetch(`/api/reviews/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      })

      if (!response.ok) throw new Error("Failed to reject review")

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
        description: "Failed to reject review. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete review")

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
        description: "Failed to delete review. Please try again.",
        variant: "destructive",
      })
      throw error
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
            <CardTitle>Filters</CardTitle>
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
                        {event.name}
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
          </CardContent>
        </Card>

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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
