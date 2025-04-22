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

        // Fetch form questions for all form types
        const formTypes = ["attendee", "volunteer", "speaker"]
        const formDataObj = { attendee: [], volunteer: [], speaker: [] }
        const formStatusObj = { attendee: "draft", volunteer: "draft", speaker: "draft" }

        for (const formType of formTypes) {
          try {
            const formResponse = await fetch(`/api/events/${eventId}/forms/${formType}`, {
              headers: {
                "Cache-Control": "no-cache",
              },
            })

            if (formResponse.ok) {
              const formData = await formResponse.json()
              formDataObj[formType] = formData.questions || []
              formStatusObj[formType] = formData.status || "draft"
            }
          } catch (error) {
            console.error(`Error fetching ${formType} form:`, error)
          }
        }

        setFormData(formDataObj)
        setFormStatus(formStatusObj)
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

      // Update all form types
      const formTypes = ["attendee", "volunteer", "speaker"]

      for (const formType of formTypes) {
        const response = await fetch(`/api/events/${eventId}/forms/${formType}/publish`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: formStatus[formType],
            questions: formData[formType],
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to update ${formType} form`)
        }
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
