"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  Users,
  Info,
  ArrowRight,
  PartyPopper,
  Frown,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { GradientCard } from "@/components/ui/gradient-card"
import { DynamicForm } from "@/components/forms/dynamic-form"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function FormPage({ params }: { params: { id: string; formType: string } }) {
  const { id, formType } = params
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Fetch form data
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log(`Fetching form data for event: ${id}, form type: ${formType}`)
        const res = await fetch(`/api/events/${id}/forms/${formType}`, {
          cache: "no-store",
        })

        if (!res.ok) {
          // Try to get more detailed error information
          try {
            const errorData = await res.json()
            throw new Error(errorData.message || errorData.error || `Failed to fetch form data. Status: ${res.status}`)
          } catch (parseError) {
            // If we can't parse the error as JSON, use the status text
            throw new Error(`Failed to fetch form data. Status: ${res.status} ${res.statusText}`)
          }
        }

        const data = await res.json()
        console.log("Form data received:", data)
        setFormData(data)
      } catch (error: any) {
        console.error("Error fetching form data:", error)
        setError(error.message || "Failed to load form data")
      } finally {
        setLoading(false)
      }
    }

    fetchFormData()
  }, [id, formType])

  // Handle form submission
  const handleSubmit = async (data: any) => {
    try {
      setSubmitting(true)
      console.log("Submitting form data:", data)

      // Add a debug email field if none exists
      // This is a fallback to ensure there's always an email field
      let hasEmail = false
      const emailFields = ["email", "corporateEmail", "userEmail", "emailAddress", "mail"]

      // Check if any of the standard email fields exist
      for (const field of emailFields) {
        if (data[field] && typeof data[field] === "string" && data[field].includes("@")) {
          hasEmail = true
          console.log(`Found email in field ${field}: ${data[field]}`)
          break
        }
      }

      // If no standard email field, look for any field that might contain an email
      if (!hasEmail) {
        // Look for any field that contains an @ symbol
        for (const key in data) {
          if (data[key] && typeof data[key] === "string" && data[key].includes("@") && data[key].includes(".")) {
            // Found a field that looks like an email
            console.log(`Found potential email in field ${key}: ${data[key]}`)
            data.email = data[key] // Add it as a standard email field
            hasEmail = true
            break
          }
        }
      }

      // If still no email, look for a field with "email" in its name
      if (!hasEmail) {
        for (const key in data) {
          if (key.toLowerCase().includes("email") || key.toLowerCase().includes("mail")) {
            console.log(`Found field with email in name: ${key} with value: ${data[key]}`)
            // If this field doesn't have a value, try to find another field to use as email
            if (!data[key] || data[key] === "") {
              continue
            }
            data.email = data[key]
            hasEmail = true
            break
          }
        }
      }

      // Last resort: check form questions for an email field
      if (!hasEmail && formData && formData.questions) {
        const emailQuestion = formData.questions.find(
          (q) =>
            q.type === "email" ||
            q.id.toLowerCase().includes("email") ||
            (q.label && q.label.toLowerCase().includes("email")),
        )

        if (emailQuestion) {
          console.log(`Found email question with id: ${emailQuestion.id}`)
          // If we found an email question but the value isn't in data, add a placeholder
          if (!data[emailQuestion.id] || data[emailQuestion.id] === "") {
            console.log("Email field exists but no value provided")
            throw new Error(
              "Please provide a valid email address in the " + (emailQuestion.label || "email") + " field.",
            )
          }
        }
      }

      // Add a debug email as absolute last resort
      if (!hasEmail) {
        console.log("No email field found in form data, adding debug email")
        // Use a field that looks like it might be a name + a placeholder domain
        let possibleName = ""
        for (const key in data) {
          if (
            key.toLowerCase().includes("name") &&
            data[key] &&
            typeof data[key] === "string" &&
            data[key].length > 0
          ) {
            possibleName = data[key].replace(/\s+/g, ".").toLowerCase()
            break
          }
        }

        if (possibleName) {
          data.email = `${possibleName}@example.com`
          console.log(`Created placeholder email: ${data.email}`)
        } else {
          data.email = `attendee.${Date.now()}@example.com`
          console.log(`Created random placeholder email: ${data.email}`)
        }
      }

      // Determine the endpoint based on form type
      let endpoint = ""
      if (formType === "register" || formType === "attendee") {
        endpoint = `/api/events/${id}/public-register`
      } else if (formType === "volunteer") {
        endpoint = `/api/events/${id}/volunteer-applications`
      } else if (formType === "speaker") {
        endpoint = `/api/events/${id}/speaker-applications`
      } else {
        throw new Error("Unknown form type")
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()

        // Check if this is a validation error with details
        if (errorData.error === "Validation error" && errorData.details) {
          console.error("Validation error details:", errorData.details)
          const errorMessage = errorData.message || "Please check your form inputs and try again."
          throw new Error(`Validation error: ${errorMessage}`)
        }

        throw new Error(errorData.error || errorData.message || "Failed to submit form")
      }

      const result = await response.json()
      console.log("Submission result:", result)

      setSuccess(true)
      toast({
        title: "Success!",
        description: result.message || "Your form has been submitted successfully.",
      })

      // Redirect after successful submission
      setTimeout(() => {
        router.push(`/events/${id}?submission=success&type=${formType}`)
      }, 2000)
    } catch (error: any) {
      console.error("Form submission error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit form. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Format the event date
  const formatEventDate = (dateString: string) => {
    try {
      if (!dateString) return "Date not set"
      const eventDate = new Date(dateString)
      return format(eventDate, "EEEE, MMMM d, yyyy")
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString || "Date not set"
    }
  }

  // Get the form title based on the form type
  const getFormTitle = () => {
    switch (formType) {
      case "register":
      case "attendee":
        return "Registration Form"
      case "volunteer":
        return "Volunteer Application"
      case "speaker":
        return "Speaker Application"
      default:
        return "Application Form"
    }
  }

  // Check if the event has passed
  const hasEventPassed = (eventData: any) => {
    try {
      if (!eventData || !eventData.date) return false

      const now = new Date()
      const eventDate = new Date(eventData.date)

      // If event has a start time, use it for comparison
      if (eventData.startTime && typeof eventData.startTime === "string") {
        const timeParts = eventData.startTime.split(":")
        if (timeParts.length >= 2) {
          const hours = Number.parseInt(timeParts[0], 10)
          const minutes = Number.parseInt(timeParts[1], 10)
          if (!isNaN(hours) && !isNaN(minutes)) {
            eventDate.setHours(hours, minutes, 0, 0)
          }
        }
      }

      return now >= eventDate
    } catch (error) {
      console.error("Error checking if event has passed:", error)
      return false
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="container max-w-4xl py-10">
        <Card>
          <CardHeader className="bg-brand-blue text-white">
            <CardTitle>Loading {getFormTitle()}</CardTitle>
            <CardDescription className="text-white/80">Please wait while we load the form...</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Loader2 className="h-10 w-10 text-brand-blue animate-spin mb-4" />
              <p className="text-gray-600">Loading form data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container max-w-4xl py-10">
        <Card>
          <CardHeader className="bg-brand-blue text-white">
            <CardTitle>Error Loading Form</CardTitle>
            <CardDescription className="text-white/80">We encountered an error while loading this form</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="rounded-full bg-brand-orange/20 p-3 mb-4">
                <AlertCircle className="h-6 w-6 text-brand-orange" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-brand-blue">Failed to load form</h3>
              <p className="text-gray-600 max-w-md mb-6">{error}</p>
              <div className="space-y-4 w-full max-w-md">
                <Button
                  className="w-full bg-brand-blue hover:bg-brand-blue/90"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/events/${id}`}>Return to Event Page</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="container max-w-4xl py-10">
        <Card>
          <CardHeader className="bg-brand-blue text-white">
            <CardTitle>Submission Successful</CardTitle>
            <CardDescription className="text-white/80">Your form has been submitted successfully</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <div className="h-10 w-10 text-green-600 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-brand-blue">Thank You!</h3>
              <p className="text-gray-600 max-w-md mb-6">Your submission has been received. We'll be in touch soon.</p>
              <Button asChild className="bg-brand-blue hover:bg-brand-blue/90">
                <Link href={`/events/${id}`}>Return to Event Page</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if form data is valid
  if (!formData || !formData.questions) {
    return (
      <div className="container max-w-4xl py-10">
        <Card>
          <CardHeader className="bg-brand-blue text-white">
            <CardTitle>Form Not Available</CardTitle>
            <CardDescription className="text-white/80">This form is not currently available</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="rounded-full bg-brand-orange/20 p-3 mb-4">
                <AlertCircle className="h-6 w-6 text-brand-orange" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-brand-blue">Form Not Available</h3>
              <p className="text-gray-600 max-w-md mb-6">
                This form is not currently available or has not been set up by the event organizer.
              </p>
              <Button asChild className="bg-brand-blue hover:bg-brand-blue/90">
                <Link href={`/events/${id}`}>Return to Event Page</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if the form is published
  if (formData.status !== "published") {
    return (
      <div className="container max-w-4xl py-10">
        <Card>
          <CardHeader className="bg-brand-blue text-white">
            <CardTitle>{getFormTitle()} - Not Available</CardTitle>
            <CardDescription className="text-white/80">
              This form is not currently available for submissions
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="rounded-full bg-brand-orange/20 p-3 mb-4">
                <AlertCircle className="h-6 w-6 text-brand-orange" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-brand-blue">Form Not Published</h3>
              <p className="text-gray-600 max-w-md mb-6">
                The organizer has not made this form available yet. Please check back later or contact the event
                organizer for more information.
              </p>
              <Button asChild className="bg-brand-blue hover:bg-brand-blue/90">
                <Link href={`/events/${id}`}>Return to Event Page</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if the event has passed
  if (hasEventPassed(formData)) {
    return (
      <div className="container max-w-4xl py-10">
        <Card className="overflow-hidden">
          <CardHeader className="bg-brand-blue text-white">
            <CardTitle>{getFormTitle()} - Event Has Passed</CardTitle>
            <CardDescription className="text-white/80">This event has already started or ended</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="relative mb-6">
                <div className="absolute -top-6 -right-6 transform rotate-12 animate-bounce-slow">
                  <PartyPopper className="h-8 w-8 text-brand-orange" />
                </div>

                <div className="rounded-full bg-brand-light-blue/20 p-6 mb-2">
                  <div className="animate-wave origin-bottom-right">
                    <Frown className="h-16 w-16 text-brand-light-blue" />
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-3 text-brand-blue">This event has already started</h3>

              <p className="text-gray-700 max-w-md mb-6">
                But there are more exciting events coming up! Browse our upcoming events and find your next opportunity.
              </p>

              <div className="space-y-4 w-full max-w-md">
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-brand-blue to-brand-light-blue hover:opacity-90 text-white"
                  size="lg"
                >
                  <Link href="/events" className="flex items-center justify-center">
                    Explore Upcoming Events
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <Button asChild variant="outline" className="w-full border-brand-blue/20 text-brand-blue">
                  <Link href={`/events/${id}`}>Return to Event Page</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Format the event date and time
  const formattedDate = formatEventDate(formData.eventDate || "")
  const formattedTime = formData.startTime
    ? `${formData.startTime}${formData.endTime ? ` - ${formData.endTime}` : ""}`
    : "Time not specified"

  // Render the form
  return (
    <div className="container max-w-4xl py-10">
      <Card>
        <CardHeader className="bg-brand-blue text-white">
          <CardTitle>
            {getFormTitle()} for {formData.eventTitle || "Event"}
          </CardTitle>
          <CardDescription className="text-white/80">
            Please fill out the form below to{" "}
            {formType === "register" || formType === "attendee" ? "register" : "apply"} for this event
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-6 space-y-4">
            <GradientCard gradientFrom="from-brand-blue/10" gradientTo="to-brand-light-blue/20">
              <div className="bg-white p-4 rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Calendar className="h-5 w-5 text-brand-blue" />
                  </div>
                  <div>
                    <p className="font-medium">Event Date</p>
                    <p className="text-sm text-gray-600">{formattedDate}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Clock className="h-5 w-5 text-brand-pink" />
                  </div>
                  <div>
                    <p className="font-medium">Event Time</p>
                    <p className="text-sm text-gray-600">{formattedTime}</p>
                  </div>
                </div>

                {formData.location && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <MapPin className="h-5 w-5 text-brand-orange" />
                    </div>
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-sm text-gray-600">{formData.location}</p>
                    </div>
                  </div>
                )}

                {formData.capacity && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Users className="h-5 w-5 text-brand-light-blue" />
                    </div>
                    <div>
                      <p className="font-medium">Capacity</p>
                      <p className="text-sm text-gray-600">{formData.capacity} attendees</p>
                    </div>
                  </div>
                )}
              </div>
            </GradientCard>

            <div className="bg-brand-orange/10 border border-brand-orange/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Info className="h-5 w-5 text-brand-orange" />
                </div>
                <div>
                  <p className="font-medium text-brand-blue">Important Information</p>
                  <p className="text-sm text-gray-700">
                    {formType === "register" || formType === "attendee"
                      ? "Please complete this registration form to secure your spot at the event."
                      : formType === "volunteer"
                        ? "Thank you for your interest in volunteering. Please complete this application form."
                        : "Thank you for your interest in speaking at this event. Please complete this application form."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Render the dynamic form */}
          <DynamicForm
            formFields={formData.questions || []}
            formTitle={getFormTitle()}
            formDescription={`Please fill out the following information to ${
              formType === "register" || formType === "attendee" ? "register" : "apply"
            } for ${formData.eventTitle || "this event"}.`}
            onSubmit={handleSubmit}
            submitButtonText={
              formType === "register" || formType === "attendee" ? "Complete Registration" : "Submit Application"
            }
            isSubmitting={submitting}
          />
        </CardContent>
      </Card>
    </div>
  )
}
