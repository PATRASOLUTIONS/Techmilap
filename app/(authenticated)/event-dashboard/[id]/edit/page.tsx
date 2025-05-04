"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { EventCreationForm } from "@/components/events/event-creation-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditEventPage() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch event data with tickets included
        const response = await fetch(`/api/events/${id}`, {
          headers: {
            "Cache-Control": "no-cache",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch event: ${response.status}`)
        }

        const data = await response.json()

        if (data.event) {
          console.log("Event data loaded successfully:", data.event.title)

          // Ensure all required properties exist
          const eventWithDefaults = {
            ...data.event,
            tickets: data.event.tickets || [],
            customQuestions: data.event.customQuestions || { attendee: [], volunteer: [], speaker: [] },
            attendeeForm: data.event.attendeeForm || { status: "draft" },
            volunteerForm: data.event.volunteerForm || { status: "draft" },
            speakerForm: data.event.speakerForm || { status: "draft" },
            type: data.event.type || "Offline",
            visibility: data.event.visibility || "Public",
            category: data.event.category || "",
            venue: data.event.venue || "",
            image: data.event.image || "",
          }

          console.log("Processed event data:", eventWithDefaults)
          setEvent(eventWithDefaults)
        } else {
          throw new Error("Event data not found in response")
        }
      } catch (error) {
        console.error("Error fetching event:", error)
        setError(error.message || "Failed to load event details")
        toast({
          title: "Error",
          description: "Failed to load event details. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchEvent()
    }
  }, [id, toast])

  const handleBack = () => {
    router.push(`/event-dashboard/${id}`)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Event
          </Button>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="text-lg font-medium">Event not found</h3>
        <p className="text-muted-foreground mt-2 max-w-md">
          {error || "The event you're looking for doesn't exist or you don't have permission to edit it."}
        </p>
        <Button asChild className="mt-6">
          <a href="/my-events">Back to My Events</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Event
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Event</h1>
        <p className="text-muted-foreground mt-2">Update your event details and settings</p>
      </div>

      <EventCreationForm existingEvent={event} isEditing={true} />
    </div>
  )
}
