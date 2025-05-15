"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StarRating } from "@/components/reviews/star-rating"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function CreateReviewPage() {
  const router = useRouter()
  const { toast } = useToast()

  // State
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [eligibleEvents, setEligibleEvents] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    eventId: "",
    rating: 5,
    title: "",
    comment: "",
  })

  // Fetch eligible events (events the user is registered for)
  useEffect(() => {
    const fetchEligibleEvents = async () => {
      try {
        setError(null)
        const response = await fetch("/api/reviews/eligible-events")

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to fetch eligible events")
        }

        const data = await response.json()
        console.log("Eligible events:", data.events)

        setEligibleEvents(data.events || [])

        if (data.events && data.events.length > 0) {
          // Auto-select the first event if available
          setFormData((prev) => ({ ...prev, eventId: data.events[0]._id }))
        }
      } catch (error: any) {
        console.error("Error fetching eligible events:", error)
        setError(error.message || "Failed to fetch eligible events")
        toast({
          title: "Error",
          description: error.message || "Failed to fetch eligible events",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchEligibleEvents()
  }, [])

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle rating change
  const handleRatingChange = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }))
  }

  // Handle event selection
  const handleEventChange = (value: string) => {
    setFormData((prev) => ({ ...prev, eventId: value }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate form
    if (!formData.eventId) {
      setError("Please select an event")
      toast({
        title: "Error",
        description: "Please select an event",
        variant: "destructive",
      })
      return
    }

    if (!formData.title.trim()) {
      setError("Please enter a review title")
      toast({
        title: "Error",
        description: "Please enter a review title",
        variant: "destructive",
      })
      return
    }

    if (!formData.comment.trim()) {
      setError("Please enter a review comment")
      toast({
        title: "Error",
        description: "Please enter a review comment",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      console.log("Submitting review:", formData)

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create review")
      }

      toast({
        title: "Success",
        description: "Your review has been submitted for approval",
      })

      // Redirect back to my reviews page
      router.push("/my-reviews")
    } catch (error: any) {
      console.error("Error submitting review:", error)
      setError(error.message || "Failed to create review")
      toast({
        title: "Error",
        description: error.message || "Failed to create review",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Write a Review</h1>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Event Review</CardTitle>
              <CardDescription>Share your experience about an event you attended</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event">Select Event</Label>
                <Select
                  value={formData.eventId}
                  onValueChange={handleEventChange}
                  disabled={loading || eligibleEvents.length === 0}
                >
                  <SelectTrigger id="event">
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleEvents.map((event) => (
                      <SelectItem key={event._id} value={event._id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {eligibleEvents.length === 0 && !loading && (
                  <p className="text-sm text-muted-foreground">
                    You don't have any eligible events to review. Please register for and attend events first.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Rating</Label>
                <StarRating rating={formData.rating} onRatingChange={handleRatingChange} size={24} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Review Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Summarize your experience"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Review Comment</Label>
                <Textarea
                  id="comment"
                  name="comment"
                  value={formData.comment}
                  onChange={handleChange}
                  placeholder="Share details of your experience at this event"
                  rows={5}
                  required
                />
              </div>
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || loading || eligibleEvents.length === 0}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
