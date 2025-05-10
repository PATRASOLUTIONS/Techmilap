"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { DynamicForm } from "@/components/forms/dynamic-form"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, AlertCircle, Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FormSuccessMessage } from "@/components/ui/form-success-message"

// Map form types to their display names and descriptions
const formTypeConfig = {
  register: {
    title: "Registration Form",
    description: "Please fill out this form to register for the event",
    successTitle: "Registration Successful!",
    successMessage: "Thank you for registering for this event. You will receive a confirmation email shortly.",
    submitText: "Register for Event",
    apiEndpoint: "attendee", // The API uses "attendee" instead of "register"
  },
  attendee: {
    title: "Registration Form",
    description: "Please fill out this form to register for the event",
    successTitle: "Registration Successful!",
    successMessage: "Thank you for registering for this event. You will receive a confirmation email shortly.",
    submitText: "Register for Event",
    apiEndpoint: "attendee",
  },
  volunteer: {
    title: "Volunteer Application",
    description: "Apply to volunteer for this event",
    successTitle: "Application Submitted!",
    successMessage:
      "Thank you for applying to volunteer for this event. The organizers will review your application and get back to you soon.",
    submitText: "Submit Application",
    apiEndpoint: "volunteer",
  },
  speaker: {
    title: "Speaker Application",
    description: "Apply to speak at this event",
    successTitle: "Application Submitted!",
    successMessage:
      "Thank you for applying to speak at this event. The organizers will review your application and get back to you soon.",
    submitText: "Submit Application",
    apiEndpoint: "speaker",
  },
}

export default function PublicFormPage() {
  const { id, formType } = useParams()
  const eventId = Array.isArray(id) ? id[0] : id
  const formTypeValue = Array.isArray(formType) ? formType[0] : formType
  const { toast } = useToast()
  const [formFields, setFormFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [formError, setFormError] = useState("")
  const [eventTitle, setEventTitle] = useState("")
  const [formStatus, setFormStatus] = useState("draft")
  const [eventDate, setEventDate] = useState(null)
  const [isEventPassed, setIsEventPassed] = useState(false)

  // Determine the API endpoint based on the form type
  const apiFormType = formTypeValue === "register" ? "attendee" : formTypeValue

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setLoading(true)
        console.log(`Fetching form data for event ${eventId} and form type ${apiFormType}`)

        // Add a timestamp to prevent caching
        const timestamp = new Date().getTime()
        const response = await fetch(`/api/events/${eventId}/forms/${apiFormType}?t=${timestamp}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch form data")
        }

        const data = await response.json()
        console.log("Form data response:", data)

        // Check if the form is published
        if (data.status !== "published") {
          setFormStatus("draft")
          setError("This form is not currently available. The event organizer has not published it yet.")
          return
        }

        setFormStatus("published")
        setFormFields(data.questions || [])

        // Fetch event details including date
        const eventResponse = await fetch(`/api/events/${eventId}`, {
          cache: "no-store",
        })

        if (eventResponse.ok) {
          const eventData = await eventResponse.json()
          setEventTitle(eventData.title || "Event")

          // Check if event date is available
          if (eventData.date) {
            const eventDateTime = new Date(eventData.date)
            setEventDate(eventDateTime)

            // Check if event has already started or passed
            const now = new Date()

            // If event has a start time, use it for comparison
            if (eventData.startTime) {
              const [hours, minutes] = eventData.startTime.split(":").map(Number)
              eventDateTime.setHours(hours, minutes, 0, 0)
            }

            if (now >= eventDateTime) {
              setIsEventPassed(true)
              setError("This form is closed because the event has already started or passed.")
            }
          }
        }
      } catch (error) {
        console.error("Error fetching form data:", error)
        setError(error.message || "Failed to load form. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (eventId && apiFormType) {
      fetchFormData()
    }
  }, [eventId, apiFormType, formTypeValue])

  const handleSubmit = async (formData) => {
    // Prevent submission if event has passed
    if (isEventPassed) {
      toast({
        title: "Form Closed",
        description: "This form is closed because the event has already started or passed.",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      setFormError("") // Clear any previous errors
      console.log(`Submitting form data for event ${eventId} and form type ${apiFormType}:`, formData)

      const response = await fetch(`/api/events/${eventId}/submissions/${apiFormType}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ formData }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        // Extract specific error message from response if available
        const errorMessage = responseData.error || responseData.message || "Failed to submit form"
        throw new Error(errorMessage)
      }

      if (!responseData.success) {
        // Handle case where API returns success: false
        throw new Error(responseData.message || "Form submission was not successful")
      }

      setSubmitted(true)
      toast({
        title: "Form Submitted",
        description: "Your form has been submitted successfully.",
      })
    } catch (error) {
      console.error("Error submitting form:", error)

      // Set a user-friendly error message
      setFormError(error.message || "Failed to submit form. Please try again.")

      toast({
        title: "Error",
        description: error.message || "Failed to submit form. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="icon" asChild className="mr-2">
            <Link href={`/events/${eventId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="icon" asChild className="mr-2">
            <Link href={`/events/${eventId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{isEventPassed ? "Form Closed" : "Form Not Available"}</h1>
        </div>
        <Card className={isEventPassed ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className={`h-5 w-5 ${isEventPassed ? "text-red-500" : "text-amber-500"}`} />
              <p className={`font-medium ${isEventPassed ? "text-red-700" : "text-amber-700"}`}>
                {isEventPassed ? "Event Has Already Started" : "Form Not Available"}
              </p>
            </div>
            <p className="text-gray-700 mb-4">{error}</p>

            {isEventPassed && eventDate && (
              <div className="flex flex-col gap-2 mb-4 p-3 bg-white rounded-md">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Event Date: {eventDate.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Current Time: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button asChild>
                <Link href={`/events/${eventId}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Event
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (formStatus !== "published") {
    return (
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="icon" asChild className="mr-2">
            <Link href={`/events/${eventId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Form Not Available</h1>
        </div>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <p className="font-medium text-amber-700">Form Not Published</p>
            </div>
            <p className="text-gray-700 mb-4">
              This form is not currently available. The event organizer has not published it yet.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button asChild>
                <Link href={`/events/${eventId}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Event
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if event has passed
  if (isEventPassed) {
    return (
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="icon" asChild className="mr-2">
            <Link href={`/events/${eventId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Form Closed</h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="font-medium text-red-700">Event Has Already Started</p>
            </div>
            <p className="text-gray-700 mb-4">This form is closed because the event has already started or passed.</p>

            {eventDate && (
              <div className="flex flex-col gap-2 mb-4 p-3 bg-white rounded-md">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Event Date: {eventDate.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Current Time: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button asChild>
                <Link href={`/events/${eventId}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Event
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="icon" asChild className="mr-2">
            <Link href={`/events/${eventId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{eventTitle}</h1>
        </div>
        <FormSuccessMessage
          title={formTypeConfig[formTypeValue]?.successTitle || "Form Submitted Successfully"}
          description={
            formTypeConfig[formTypeValue]?.successMessage ||
            "Thank you for your submission. The event organizer will review your information."
          }
          backUrl={`/events/${eventId}`}
          backLabel="Back to Event"
        />
      </div>
    )
  }

  const config = formTypeConfig[formTypeValue] || {
    title: "Form",
    description: "Please fill out this form",
    submitText: "Submit",
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-2">
          <Link href={`/events/${eventId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{eventTitle}</h1>
      </div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">{config.title}</h2>
        <p className="text-muted-foreground">{config.description}</p>
      </div>

      {/* Display form error if any */}
      {formError && (
        <Card className="border-red-200 bg-red-50 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="font-medium text-red-700">Error</p>
            </div>
            <p className="text-gray-700 mt-2">{formError}</p>
          </CardContent>
        </Card>
      )}

      {formFields.length > 0 ? (
        <DynamicForm
          formFields={formFields}
          formTitle={config.title}
          formDescription={config.description}
          onSubmit={handleSubmit}
          submitButtonText={config.submitText}
          isSubmitting={submitting}
        />
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">No form fields found. The form may not be properly configured.</p>
          <Button asChild className="mt-4">
            <Link href={`/events/${eventId}`}>Back to Event</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
