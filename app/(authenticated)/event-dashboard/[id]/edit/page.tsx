"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { EventDetailsForm } from "@/components/events/event-details-form"

export default function EditEventPage() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const [formStatus, setFormStatus] = useState({
    attendee: "draft",
    volunteer: "draft",
    speaker: "draft",
  })

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/events/${id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch event")
        }

        const data = await response.json()
        if (data.event) {
          setEvent(data.event)

          setFormStatus({
            attendee: data.event.attendeeForm?.status || "draft",
            volunteer: data.event.volunteerForm?.status || "draft",
            speaker: data.event.speakerForm?.status || "draft",
          })
        }
      } catch (error) {
        console.error("Error fetching event:", error)
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

  const updateFormStatus = (formType, status) => {
    setFormStatus((prev) => ({
      ...prev,
      [formType]: status,
    }))
  }

  const handleSubmit = async (formData) => {
    try {
      const eventData = {
        ...formData,
        attendeeForm: { status: formStatus.attendee },
        volunteerForm: { status: formStatus.volunteer },
        speakerForm: { status: formStatus.speaker },
      }

      const response = await fetch(`/api/events/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      })

      if (!response.ok) {
        throw new Error("Failed to update event")
      }

      toast({
        title: "Success",
        description: "Event updated successfully",
      })

      router.push(`/event-dashboard/${id}`)
    } catch (error) {
      console.error("Error updating event:", error)
      toast({
        title: "Error",
        description: "Failed to update event. Please try again later.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Event
          </Button>
        </div>
        <div className="h-8 w-64 bg-muted animate-pulse rounded-md"></div>
        <div className="h-96 bg-muted animate-pulse rounded-lg"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="text-lg font-medium">Event not found</h3>
        <p className="text-muted-foreground mt-2 max-w-md">
          The event you're looking for doesn't exist or you don't have permission to edit it.
        </p>
        <Button asChild className="mt-6">
          <a href="/my-events">Back to My Events</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Event
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Event</h1>
        <p className="text-muted-foreground mt-2">Update your event details and settings</p>
      </div>

      <EventDetailsForm initialData={event} onSubmit={handleSubmit} submitButtonText="Update Event" />
    </div>
  )
}
