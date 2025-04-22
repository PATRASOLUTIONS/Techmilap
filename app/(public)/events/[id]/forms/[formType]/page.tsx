"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { DynamicForm } from "@/components/forms/dynamic-form"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSession } from "next-auth/react"
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

export default function EventFormPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { data: session } = useSession()

  // Extract parameters from the URL
  const eventIdOrSlug = Array.isArray(params.id) ? params.id[0] : params.id
  const formType = Array.isArray(params.formType) ? params.formType[0] : params.formType

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [event, setEvent] = useState(null)
  const [formConfig, setFormConfig] = useState({
    title: "",
    description: "",
    fields: [],
    status: "draft",
  })
  const [isValidFormType, setIsValidFormType] = useState(!!formTypeConfig[formType])
  const [apiEndpoint, setApiEndpoint] = useState(formTypeConfig[formType]?.apiEndpoint || "")
  const [successTitle, setSuccessTitle] = useState(formTypeConfig[formType]?.successTitle || "")
  const [successMessage, setSuccessMessage] = useState(formTypeConfig[formType]?.successMessage || "")
  const [submitText, setSubmitText] = useState(formTypeConfig[formType]?.submitText || "")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (formTypeConfig[formType]) {
      setIsValidFormType(true)
      setApiEndpoint(formTypeConfig[formType].apiEndpoint)
      setSuccessTitle(formTypeConfig[formType].successTitle)
      setSuccessMessage(formTypeConfig[formType].successMessage)
      setSubmitText(formTypeConfig[formType].submitText)
    } else {
      setIsValidFormType(false)
    }
  }, [formType])

  const isSuccess = searchParams.get("success") === "true"

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        console.log(`Fetching event data for ID/slug: ${eventIdOrSlug}`)

        // Fetch event details
        const eventResponse = await fetch(`/api/events/${eventIdOrSlug}`, {
          headers: {
            "x-public-request": "true",
          },
        })

        if (!eventResponse.ok) {
          const errorText = await eventResponse.text()
          console.error(`Event fetch failed: ${eventResponse.status}`, errorText)
          throw new Error(`Event not found or not available (${eventResponse.status})`)
        }

        const eventData = await eventResponse.json()

        if (!eventData.event) {
          console.error("Event data missing in response:", eventData)
          throw new Error("Event data missing in response")
        }

        setEvent(eventData.event)
        const eventId = eventData.event._id // Use the actual MongoDB ID for form fetching

        console.log(`Fetching form config for event ID: ${eventId}, form type: ${apiEndpoint}`)

        // Fetch form configuration using the actual MongoDB ID
        const formResponse = await fetch(`/api/events/${eventId}/forms/${apiEndpoint}/config`, {
          headers: {
            "x-public-request": "true",
          },
        })

        if (!formResponse.ok) {
          const errorText = await formResponse.text()
          console.error(`Form fetch failed: ${formResponse.status}`, errorText)
          throw new Error(`Form not available (${formResponse.status})`)
        }

        const formData = await formResponse.json()

        // Ensure form has valid fields
        const form = formData.form || {}
        form.fields = Array.isArray(form.fields) ? form.fields : []

        setFormConfig(form)
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(error.message || `Failed to load ${formType} form`)
        toast({
          title: "Error",
          description: error.message || `Failed to load ${formType} form`,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (eventIdOrSlug && apiEndpoint) {
      fetchData()
    }
  }, [eventIdOrSlug, apiEndpoint, formType, toast])

  const handleSubmit = async (data) => {
    try {
      setSubmitting(true)

      if (!event || !event._id) {
        throw new Error("Event information is missing")
      }

      // Clean and prepare the form data
      const cleanData = {}

      // Copy all form data, ensuring no undefined values
      Object.keys(data).forEach((key) => {
        // Convert undefined to empty string to avoid JSON issues
        cleanData[key] = data[key] === undefined ? "" : data[key]
      })

      // Add basic information based on form type
      if (formType === "register") {
        cleanData.firstName = data.firstName || session?.user?.name?.split(" ")[0] || ""
        cleanData.lastName = data.lastName || session?.user?.name?.split(" ").slice(1).join(" ") || ""
        cleanData.email = data.email || session?.user?.email || ""
        cleanData.name = `${cleanData.firstName} ${cleanData.lastName}`.trim()
      } else {
        // For volunteer and speaker forms
        cleanData.name = data.name || session?.user?.name || ""
        cleanData.email = data.email || session?.user?.email || ""
      }

      console.log("Form data prepared:", cleanData)

      // Create the submission payload with a clean structure
      const payload = {
        data: cleanData,
        userId: session?.user?.id || null,
      }

      console.log("Submitting form data:", JSON.stringify(payload))

      // Use the actual MongoDB ID for submission
      const response = await fetch(`/api/events/${event._id}/submissions/${apiEndpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = "Failed to submit form"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          console.error("Could not parse error response:", e)
        }
        throw new Error(errorMessage)
      }

      // Success! Show toast and redirect
      toast({
        title: formType === "register" ? "Registration Successful" : "Application Submitted",
        description:
          formType === "register"
            ? "You have successfully registered for this event"
            : `Your ${formType} application has been submitted successfully`,
      })

      router.push(`/events/${eventIdOrSlug}/forms/${formType}?success=true`)
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: formType === "register" ? "Registration Failed" : "Application Failed",
        description: error.message || "Failed to submit form",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Prepare default values if user is logged in
  const defaultValues = {}
  if (session?.user) {
    // Add basic user information based on form type
    defaultValues.email = session.user.email || ""

    if (formType === "register") {
      if (session.user.name) {
        const nameParts = session.user.name.split(" ")
        defaultValues.firstName = nameParts[0] || ""
        defaultValues.lastName = nameParts.slice(1).join(" ") || ""
      }
    } else {
      defaultValues.name = session.user.name || ""
    }

    // Try to pre-fill custom fields
    if (formConfig.fields && Array.isArray(formConfig.fields)) {
      formConfig.fields.forEach((field) => {
        if (field && field.id) {
          if (field.type === "email" && !defaultValues[field.id]) {
            defaultValues[field.id] = session.user.email || ""
          } else if (field.id.toLowerCase().includes("name") && !defaultValues[field.id]) {
            defaultValues[field.id] = session.user.name || ""
          }
        }
      })
    }
  }

  if (!isValidFormType) {
    return (
      <div className="container mx-auto py-8 max-w-3xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">Invalid Form Type</h2>
          <p className="text-red-600 mb-4">The requested form type is not valid.</p>
          <Button asChild variant="outline">
            <Link href={`/events/${eventIdOrSlug}`}>Back to Event</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading form...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 max-w-3xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Form</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button asChild variant="outline">
            <Link href={`/events/${eventIdOrSlug}`}>Back to Event</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="container mx-auto py-8 max-w-3xl">
        <FormSuccessMessage
          title={successTitle}
          message={successMessage}
          eventId={eventIdOrSlug}
          formType={apiEndpoint}
        />
      </div>
    )
  }

  // Format the title based on form type
  const pageTitle =
    formType === "register"
      ? `Register for ${event?.title || "Event"}`
      : formType === "volunteer"
        ? `Volunteer for ${event?.title || "Event"}`
        : `Speak at ${event?.title || "Event"}`

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-2">
          <Link href={`/events/${eventIdOrSlug}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{pageTitle}</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DynamicForm
            formFields={formConfig.fields || []}
            formTitle={formConfig.title || formTypeConfig[formType].title}
            formDescription={formConfig.description || formTypeConfig[formType].description}
            onSubmit={handleSubmit}
            defaultValues={defaultValues}
            submitButtonText={submitText}
            isSubmitting={submitting}
          />
        </CardContent>
      </Card>
    </div>
  )
}
