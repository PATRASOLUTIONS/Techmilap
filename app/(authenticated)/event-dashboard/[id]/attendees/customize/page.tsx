"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CustomQuestionsForm } from "@/components/events/custom-questions-form"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function AttendeeFormCustomizePage() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formStatus, setFormStatus] = useState("draft")
  const [customQuestions, setCustomQuestions] = useState({ attendee: [], volunteer: [], speaker: [] })
  const [eventDetails, setEventDetails] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch event details
        const response = await fetch(`/api/events/${id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch event data")
        }

        const data = await response.json()
        setEventDetails(data.event)

        // Get the attendee form data specifically
        try {
          const formResponse = await fetch(`/api/events/${id}/forms/attendee`)

          if (formResponse.ok) {
            const formData = await formResponse.json()

            // Update the form status
            setFormStatus(formData.status || "draft")

            // Initialize custom questions object with attendee questions from API
            if (Array.isArray(formData.questions)) {
              setCustomQuestions((prev) => ({
                ...prev,
                attendee: formData.questions,
              }))
            }
          }
        } catch (formError) {
          console.error("Error fetching form data:", formError)
          // Continue with default questions if form data fetch fails
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(error.message || "Failed to load form data")
        toast({
          title: "Error",
          description: "Failed to load form data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchEventData()
    }
  }, [id, toast])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      // Only use the attendee questions part of the customQuestions
      const attendeeQuestions = customQuestions.attendee || []

      // Ensure we have valid questions data
      if (!Array.isArray(attendeeQuestions) || attendeeQuestions.length === 0) {
        toast({
          title: "Error",
          description: "No questions found. Please add at least one question before publishing.",
          variant: "destructive",
        })
        setSaving(false)
        return
      }

      // Log the data being sent for debugging
      console.log("Publishing form with data:", {
        status: formStatus,
        questions: attendeeQuestions,
      })

      const response = await fetch(`/api/events/${id}/forms/attendee/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: formStatus,
          questions: attendeeQuestions,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Server response:", errorData)
        throw new Error(errorData.error || `Failed to save form (Status: ${response.status})`)
      }

      const responseData = await response.json()
      console.log("Server response:", responseData)

      toast({
        title: formStatus === "published" ? "Form published" : "Form saved as draft",
        description:
          formStatus === "published"
            ? "Your attendee form is now accepting registrations"
            : "Your attendee form has been saved as a draft",
      })

      // Redirect back to the event dashboard
      router.push(`/event-dashboard/${id}?tab=forms`)
    } catch (error) {
      console.error("Error saving form:", error)
      setError(error.message || "Failed to save form")
      toast({
        title: "Error",
        description: "Failed to save form. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePublish = () => {
    const newStatus = formStatus === "published" ? "draft" : "published"
    setFormStatus(newStatus)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-5xl">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/event-dashboard/${id}?tab=forms`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="h-8 w-64 bg-muted animate-pulse rounded-md"></div>
        </div>
        <div className="h-96 bg-muted animate-pulse rounded-lg"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 max-w-5xl">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/event-dashboard/${id}?tab=forms`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Error Loading Form</h1>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-destructive mb-2">Something went wrong</h2>
              <p className="mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/event-dashboard/${id}?tab=forms`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Customize Attendee Registration Form</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-2 mr-2">
            <Switch id="publish-switch" checked={formStatus === "published"} onCheckedChange={handleTogglePublish} />
            <Label htmlFor="publish-switch">{formStatus === "published" ? "Published" : "Draft"}</Label>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-primary to-secondary">
            {saving ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {formStatus === "published" ? "Save & Publish" : "Save as Draft"}
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendee Form Settings</CardTitle>
          <CardDescription>
            Customize the information you collect from attendees registering for your event
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Use the CustomQuestionsForm component with active tab set to attendee */}
          <CustomQuestionsForm
            data={customQuestions}
            updateData={setCustomQuestions}
            eventId={id.toString()}
            eventSlug={eventDetails?.slug || null}
          />
        </CardContent>
      </Card>
    </div>
  )
}
