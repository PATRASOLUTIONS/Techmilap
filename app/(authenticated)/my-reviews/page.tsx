"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ReviewList } from "@/components/reviews/review-list"
import { useToast } from "@/hooks/use-toast"
import { PlusCircle, Search, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function MyReviewsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Parse query parameters
  const currentTab = searchParams.get("tab") || "all"
  const currentPage = Number.parseInt(searchParams.get("page") || "1")
  const currentEventId = searchParams.get("eventId") || ""
  const currentSearch = searchParams.get("search") || ""

  // State
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: currentPage,
    limit: 10,
    pages: 0,
  })
  const [searchTerm, setSearchTerm] = useState(currentSearch)

  // Fetch reviews
  const fetchReviews = async () => {
    setLoading(true)
    setError(null)
    try {
      // Build query parameters
      const params = new URLSearchParams()
      params.append("page", pagination.page.toString())
      params.append("limit", pagination.limit.toString())

      if (currentTab !== "all") {
        params.append("status", currentTab)
      }

      if (currentEventId) {
        params.append("eventId", currentEventId)
      }

      if (searchTerm) {
        params.append("search", searchTerm)
      }

      console.log("Fetching reviews with params:", params.toString())
      const response = await fetch(`/api/reviews/my-reviews?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch reviews")
      }

      const data = await response.json()
      console.log("Received reviews data:", data)

      // Add null checks
      setReviews(data.reviews || [])
      setPagination(
        data.pagination || {
          total: 0,
          page: currentPage,
          limit: 10,
          pages: 0,
        },
      )
      setEvents(data.events || [])
    } catch (error) {
      console.error("Error fetching reviews:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch reviews")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch reviews",
        variant: "destructive",
      })
      // Set empty data on error
      setReviews([])
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`/my-reviews?${params.toString()}`)
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    params.delete("page") // Reset to page 1
    router.push(`/my-reviews?${params.toString()}`)
  }

  // Handle event filter change
  const handleEventChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set("eventId", value)
    } else {
      params.delete("eventId")
    }
    params.delete("page") // Reset to page 1
    router.push(`/my-reviews?${params.toString()}`)
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchTerm) {
      params.set("search", searchTerm)
    } else {
      params.delete("search")
    }
    params.delete("page") // Reset to page 1
    router.push(`/my-reviews?${params.toString()}`)
  }

  // Handle review deletion
  const handleDeleteReview = async (id: string) => {
    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete review")
      }

      toast({
        title: "Success",
        description: "Review deleted successfully",
      })

      // Refresh reviews
      fetchReviews()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete review",
        variant: "destructive",
      })
    }
  }

  // Handle edit review
  const handleEditReview = (id: string) => {
    router.push(`/my-reviews/edit/${id}`)
  }

  // Effect to fetch reviews when parameters change
  useEffect(() => {
    if (session?.user) {
      fetchReviews()
    }
  }, [searchParams, session])

  // Calculate review statistics with null checks
  const myReviews =
    reviews?.filter((review) => {
      const reviewUserId = review.userId?._id || review.userId
      const sessionUserId = session?.user?.id
      return reviewUserId && sessionUserId && reviewUserId.toString() === sessionUserId.toString()
    }) || []

  const pendingReviews = reviews?.filter((review) => review.status === "pending") || []
  const approvedReviews = reviews?.filter((review) => review.status === "approved") || []

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Reviews</h1>
          <p className="text-muted-foreground">View and manage reviews for events you've attended</p>
        </div>
        <Button
          onClick={() => router.push("/my-reviews/create")}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Write a Review
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">My Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myReviews.length}</div>
            <p className="text-xs text-muted-foreground">Reviews you've written</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReviews.length}</div>
            <p className="text-xs text-muted-foreground">Reviews awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedReviews.length}</div>
            <p className="text-xs text-muted-foreground">Published reviews</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:w-1/3">
          <label htmlFor="event-filter" className="text-sm font-medium block mb-2">
            Filter by Event
          </label>
          <Select value={currentEventId} onValueChange={handleEventChange}>
            <SelectTrigger id="event-filter">
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((event) => (
                <SelectItem key={event._id} value={event._id.toString()}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <form onSubmit={handleSearch} className="w-full md:w-2/3 flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>
      </div>

      <Tabs defaultValue={currentTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">All Reviews</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={currentTab} className="mt-6">
          <ReviewList
            reviews={reviews}
            loading={loading}
            page={pagination.page}
            totalPages={pagination.pages}
            onPageChange={handlePageChange}
            onDelete={handleDeleteReview}
            onEdit={handleEditReview}
            showEventDetails={true}
          />

          {reviews.length === 0 && !loading && (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium">No reviews found</h3>
              <p className="text-muted-foreground">
                {currentTab === "all"
                  ? "You haven't written any reviews yet or there are no reviews for events you've attended."
                  : `No ${currentTab} reviews found.`}
              </p>
              <Button variant="outline" className="mt-4" onClick={() => router.push("/my-reviews/create")}>
                Write a Review
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
