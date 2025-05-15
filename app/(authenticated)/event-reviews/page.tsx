"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Search, Plus, Filter } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ReviewList } from "@/components/reviews/review-list"
import { ReviewStats } from "@/components/reviews/review-stats"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StarRating } from "@/components/reviews/star-rating"

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

  // Review form
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewFormData, setReviewFormData] = useState({
    eventId: "",
    rating: 5,
    title: "",
    comment: "",
  })
  const [submitting, setSubmitting] = useState(false)

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [limit] = useState(10)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    fetchEvents()
    fetchReviews()
  }, [session, status, router, page, selectedEvent, selectedRating, selectedStatus, searchQuery, currentTab])

  const fetchEvents = async () => {
    try {
      // For event planners, fetch their events
      // For users, fetch events they've attended
      const endpoint =
        session?.user?.role === "event-planner" ? "/api/events/my-events/all" : "/api/reviews/eligible-events"
      const response = await fetch(endpoint)
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

      // Different endpoints for different user roles
      const endpoint =
        session?.user?.role === "event-planner"
          ? `/api/reviews/planner?${queryParams.toString()}`
          : `/api/reviews/my-reviews?${queryParams.toString()}`

      const response = await fetch(endpoint)
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
          review._id === id ? { ...review, reply: { text, createdAt: new Date().toISOString() } } : review,
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

  const handleSubmitReview = async (e) => {
    e.preventDefault()

    if (!reviewFormData.eventId) {
      toast({
        title: "Error",
        description: "Please select an event to review",
        variant: "destructive",
      })
      return
    }

    if (!reviewFormData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a review title",
        variant: "destructive",
      })
      return
    }

    if (!reviewFormData.comment.trim()) {
      toast({
        title: "Error",
        description: "Please enter your review",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewFormData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit review")
      }

      toast({
        title: "Success",
        description: "Your review has been submitted successfully",
      })

      // Reset form and close dialog
      setReviewFormData({
        eventId: "",
        rating: 5,
        title: "",
        comment: "",
      })
      setReviewDialogOpen(false)

      // Refresh reviews
      fetchReviews()
    } catch (error) {
      console.error("Error submitting review:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit review. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleReviewFormChange = (e) => {
    const { name, value } = e.target
    setReviewFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleRatingChange = (rating) => {
    setReviewFormData((prev) => ({
      ...prev,
      rating,
    }))
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
          <h1 className="text-3xl font-bold tracking-tight">
            {session?.user?.role === "event-planner" ? "Event Reviews" : "My Reviews"}
          </h1>
          <p className="text-muted-foreground">
            {session?.user?.role === "event-planner"
              ? "Manage and respond to reviews for all your events"
              : "View and manage your reviews for events you've attended"}
          </p>
        </div>

        {session?.user?.role !== "event-planner" && (
          <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                <Plus className="mr-2 h-4 w-4" /> Write a Review
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Write a Review</DialogTitle>
                <DialogDescription>Share your experience about an event you attended</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitReview}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="eventId">Select Event</Label>
                    <Select
                      name="eventId"
                      value={reviewFormData.eventId}
                      onValueChange={(value) => setReviewFormData((prev) => ({ ...prev, eventId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an event" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.length === 0 ? (
                          <SelectItem value="" disabled>
                            No eligible events found
                          </SelectItem>
                        ) : (
                          events.map((event) => (
                            <SelectItem key={event._id} value={event._id}>
                              {event.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Rating</Label>
                    <StarRating rating={reviewFormData.rating} onRatingChange={handleRatingChange} size={24} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="title">Review Title</Label>
                    <Input
                      id="title"
                      name="title"
                      value={reviewFormData.title}
                      onChange={handleReviewFormChange}
                      placeholder="Summarize your experience"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="comment">Your Review</Label>
                    <Textarea
                      id="comment"
                      name="comment"
                      value={reviewFormData.comment}
                      onChange={handleReviewFormChange}
                      placeholder="Share details of your experience at this event"
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setReviewDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || events.length === 0}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    {submitting ? "Submitting..." : "Submit Review"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Review Statistics</CardTitle>
            <CardDescription>
              {session?.user?.role === "event-planner"
                ? "Overview of all reviews for your events"
                : "Overview of your reviews for events you've attended"}
            </CardDescription>
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
                {session?.user?.role === "event-planner" && (
                  <TabsTrigger value="pending">
                    Pending
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{stats.pending}</span>
                  </TabsTrigger>
                )}
                <TabsTrigger value="approved">
                  Approved
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{stats.approved}</span>
                </TabsTrigger>
                {session?.user?.role === "event-planner" && (
                  <TabsTrigger value="rejected">
                    Rejected
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{stats.rejected}</span>
                  </TabsTrigger>
                )}
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
              onReply={session?.user?.role === "event-planner" ? handleReply : undefined}
              onApprove={session?.user?.role === "event-planner" ? handleApprove : undefined}
              onReject={session?.user?.role === "event-planner" ? handleReject : undefined}
              onDelete={handleDelete}
              onEdit={
                session?.user?.role !== "event-planner" ? (id) => router.push(`/my-reviews/edit/${id}`) : undefined
              }
              showEventDetails={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
