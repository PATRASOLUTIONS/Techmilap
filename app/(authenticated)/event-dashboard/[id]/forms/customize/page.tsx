"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CustomQuestionsForm } from "@/components/events/custom-questions-form"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

export default function FormsCustomizePage() {
  const { id } = useParams() || {}
  const eventId = Array.isArray(id) ? id[0] : id
  const router = useRouter()
  const { toast } = useToast()

  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    attendee: [],
    volunteer: [],
    speaker: [],
  })
  const [formStatus, setFormStatus] = useState({
    attendee: "draft",
    volunteer: "draft",
    speaker: "draft",
  })

  useEffect(() => {
    const fetchEventAndForms = async () => {
      if (!eventId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Fetch event data
        const eventResponse = await fetch(`/api/events/${eventId}`, {
          headers: {
            "Cache-Control": "no-cache",
          },
        })

        if (!eventResponse.ok) {
          throw new Error(`Failed to fetch event (Status: ${eventResponse.status})`)
        }

        const eventData = await eventResponse.json()
        setEvent(eventData.event)

        // Extract form data from the event
        const customQuestions = eventData.event.customQuestions || {}
        const formDataObj = {
          attendee: Array.isArray(customQuestions.attendee) ? customQuestions.attendee : [],
          volunteer: Array.isArray(customQuestions.volunteer) ? customQuestions.volunteer : [],
          speaker: Array.isArray(customQuestions.speaker) ? customQuestions.speaker : [],
        }

        // Extract form status from the event
        const formStatusObj = {
          attendee: eventData.event.attendeeForm?.status || "draft",
          volunteer: eventData.event.volunteerForm?.status || "draft",
          speaker: eventData.event.speakerForm?.status || "draft",
        }

        setFormData(formDataObj)
        setFormStatus(formStatusObj)

        console.log("Fetched form data:", formDataObj)
        console.log("Fetched form status:", formStatusObj)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchEventAndForms()
  }, [eventId, toast])

  const handleUpdateFormData = (data) => {
    setFormData(data)
  }

  const handleUpdateFormStatus = (formType, status) => {
    setFormStatus((prev) => ({
      ...prev,
      [formType]: status,
    }))
  }

  const handleSaveAll = async () => {
    if (!eventId) return

    try {
      setSaving(true)

      // Update the event with all form data and status
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customQuestions: formData,
          attendeeForm: { status: formStatus.attendee },
          volunteerForm: { status: formStatus.volunteer },
          speakerForm: { status: formStatus.speaker },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update forms")
      }

      toast({
        title: "Forms saved",
        description: "All form changes have been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving forms:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save forms. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/event-dashboard/${eventId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-5 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="outline" size="icon" asChild>
            <Link href="/my-events">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Event Not Found</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The event you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link href="/my-events">Back to My Events</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/event-dashboard/${eventId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Form Customization</h1>
            <p className="text-muted-foreground">{event.title || "Untitled Event"}</p>
          </div>
        </div>
        <Button onClick={handleSaveAll} disabled={saving}>
          {saving ? (
            "Saving..."
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save All Forms
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customize Event Forms</CardTitle>
          <CardDescription>
            Customize the registration, volunteer, and speaker forms for your event. Add custom questions to collect the
            information you need.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomQuestionsForm
            data={formData}
            updateData={handleUpdateFormData}
            eventId={eventId}
            updateFormStatus={handleUpdateFormStatus}
          />
        </CardContent>
      </Card>
    </div>
  )
}
