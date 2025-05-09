"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { DynamicForm } from "@/components/forms/dynamic-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Calendar, AlertCircle, Mail } from "lucide-react"
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

// Validation patterns
const validationPatterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
  url: /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
  linkedIn: /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/,
  github: /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/,
}

// Function to enhance form fields with validation
function enhanceFormFieldsWithValidation(fields) {
  if (!Array.isArray(fields)) return []

  return fields.map((field) => {
    if (!field || !field.id || !field.type) return field

    const enhancedField = { ...field }

    // Add validation based on field type and label
    if (field.type === "email") {
      enhancedField.validation = {
        pattern: validationPatterns.email,
        message: "Please enter a valid email address",
      }
    } else if (
      field.type === "phone" ||
      field.label?.toLowerCase().includes("mobile") ||
      field.label?.toLowerCase().includes("phone")
    ) {
      enhancedField.validation = {
        pattern: validationPatterns.phone,
        message: "Please enter a valid phone number",
      }
    } else if (field.label?.toLowerCase().includes("linkedin")) {
      enhancedField.validation = {
        pattern: validationPatterns.linkedIn,
        message: "Please enter a valid LinkedIn profile URL",
      }
    } else if (field.label?.toLowerCase().includes("github")) {
      enhancedField.validation = {
        pattern: validationPatterns.github,
        message: "Please enter a valid GitHub profile URL",
      }
    } else if (
      field.label?.toLowerCase().includes("url") ||
      field.label?.toLowerCase().includes("website") ||
      field.label?.toLowerCase().includes("profile link") ||
      field.label?.toLowerCase().includes("social media")
    ) {
      enhancedField.validation = {
        pattern: validationPatterns.url,
        message: "Please enter a valid URL",
      }
    }

    return enhancedField
  })
}

export default function PublicFormPage() {
  const { id, formType } = useParams()
  const eventId = Array.isArray(id) ? id[0] : id
  const formTypeValue = Array.isArray(formType) ? formType[0] : formType
  const { toast } = useToast()
  const [formConfig, setFormConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [eventTitle, setEventTitle] = useState("")

  // Add a ref to track if the form status has been fetched
  const formStatusFetched = useRef(false)

  useEffect(() => {
    // Only fetch form status once
    if (formStatusFetched.current) return

    const fetchFormConfig = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/events/${eventId}/forms/${formTypeValue}/config`, {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch form configuration")
        }

        const data = await response.json()
        setFormConfig(data.config)
        setEventTitle(data.eventTitle || "Event")
        formStatusFetched.current = true
      } catch (error) {
        console.error("Error fetching form config:", error)
        setError("Failed to load form. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchFormConfig()
  }, [eventId, formTypeValue])

  const handleSubmit = async (formData) => {
    try {
      setSubmitting(true)
      const response = await fetch(`/api/events/${eventId}/submissions/${formTypeValue}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ formData }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit form")
      }

      setSubmitted(true)
      toast({
        title: "Form Submitted",
        description: "Your form has been submitted successfully.",
      })
    } catch (error) {
      console.error("Error submitting form:", error)
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
          <h1 className="text-2xl font-bold">Error</h1>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
        <Button asChild className="mt-4">
          <Link href={`/events/${eventId}`}>Back to Event</Link>
        </Button>
      </div>
    )
  }

  if (!formConfig) {
    return (
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="icon" asChild className="mr-2">
            <Link href={`/events/${eventId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Form Not Found</h1>
        </div>
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded">
          This form is not available or has not been configured by the event organizer.
        </div>
        <Button asChild className="mt-4">
          <Link href={`/events/${eventId}`}>Back to Event</Link>
        </Button>
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
          title="Form Submitted Successfully"
          description="Thank you for your submission. The event organizer will review your information."
          backUrl={`/events/${eventId}`}
          backLabel="Back to Event"
        />
      </div>
    )
  }

  const formTitle =
    {
      attendee: "Registration Form",
      volunteer: "Volunteer Application",
      speaker: "Speaker Application",
    }[formTypeValue] || "Form"

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
        <h2 className="text-xl font-semibold mb-2">{formTitle}</h2>
        <p className="text-muted-foreground">
          Please fill out the form below to {formTypeValue === "attendee" ? "register" : "apply"} for this event.
        </p>
      </div>
      <DynamicForm
        config={formConfig}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel={formTypeValue === "attendee" ? "Register" : "Submit Application"}
      />
    </div>
  )
}

const ExpiredEventMessage = () => (
  <Card className="border-red-200 bg-red-50">
    <CardHeader>
      <div className="flex items-center space-x-2">
        <AlertCircle className="h-5 w-5 text-red-500" />
        <CardTitle className="text-red-700">Event Completed</CardTitle>
      </div>
      <CardDescription className="text-red-600">
        Sorry, this event has already ended and is no longer accepting submissions.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-gray-700 mb-4">
        The event you're trying to apply for has already been completed. Please check out our other upcoming events.
      </p>
    </CardContent>
    <CardFooter>
      <Button asChild>
        <Link href="/explore">
          <Calendar className="mr-2 h-4 w-4" />
          Explore Other Events
        </Link>
      </Button>
    </CardFooter>
  </Card>
)

const FormNotPublishedMessage = ({ eventTitle, formType, eventIdOrSlug }) => (
  <Card className="border-amber-200 bg-amber-50">
    <CardHeader>
      <div className="flex items-center space-x-2">
        <AlertCircle className="h-5 w-5 text-amber-500" />
        <CardTitle className="text-amber-700">Form Not Available</CardTitle>
      </div>
      <CardDescription className="text-amber-600">The organizer hasn't published this form yet.</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-gray-700 mb-4">
        The {formTypeConfig[formType]?.title.toLowerCase() || formType} form for "{eventTitle}" is not currently
        available. The event organizer may still be setting up this form or has chosen not to make it public yet.
      </p>
      <p className="text-gray-700 mb-4">
        If you believe this is an error, you can contact the event organizer for more information.
      </p>
    </CardContent>
    <CardFooter className="flex flex-col sm:flex-row gap-3">
      <Button asChild>
        <Link href={`/events/${eventIdOrSlug}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Event
        </Link>
      </Button>
      <Button variant="outline">
        <Mail className="mr-2 h-4 w-4" />
        Contact Organizer
      </Button>
    </CardFooter>
  </Card>
)
