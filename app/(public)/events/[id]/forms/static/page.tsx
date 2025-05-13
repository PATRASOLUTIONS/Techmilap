"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { DynamicForm } from "@/components/forms/dynamic-form"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, AlertCircle, RefreshCcw, Bug } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FormSuccessMessage } from "@/components/ui/form-success-message"

export default function StaticFormPage() {
  const { id } = useParams()
  const eventId = Array.isArray(id) ? id[0] : id
  const { toast } = useToast()
  const [formFields, setFormFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [eventTitle, setEventTitle] = useState("")
  const [debugInfo, setDebugInfo] = useState("")
  const [showDebug, setShowDebug] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Function to safely parse JSON with error handling
  const safeJsonParse = async (response) => {
    try {
      const text = await response.text()
      setDebugInfo(text.substring(0, 5000)) // Save first 5000 chars for debugging

      try {
        // Try to parse the text as JSON
        return { success: true, data: JSON.parse(text) }
      } catch (error) {
        console.error("JSON parse error:", error)
        console.error("Response text:", text.substring(0, 500) + "...") // Log first 500 chars

        // Check if it's an HTML response
        if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
          return {
            success: false,
            error: "Server returned HTML instead of JSON. This might indicate a server error.",
          }
        }

        return {
          success: false,
          error: "Failed to parse server response as JSON",
          rawResponse: text.substring(0, 1000), // Include part of the raw response for debugging
        }
      }
    } catch (fetchError) {
      console.error("Error reading response:", fetchError)
      return {
        success: false,
        error: "Failed to read server response",
        details: fetchError instanceof Error ? fetchError.message : "Unknown error",
      }
    }
  }

  useEffect(() => {
    const fetchStaticForm = async () => {
      try {
        setLoading(true)
        console.log(`Fetching static form data for event ${eventId}`)

        // Add a timestamp to prevent caching
        const timestamp = new Date().getTime()
        const url = `/api/events/${eventId}/forms/static?t=${timestamp}`
        console.log(`Fetching from URL: ${url}`)

        const response = await fetch(url, {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        })

        console.log(`Response status: ${response.status}`)
        console.log(`Response headers:`, Object.fromEntries(response.headers.entries()))

        if (!response.ok) {
          // Parse the response carefully
          const result = await safeJsonParse(response)

          if (result.success) {
            throw new Error(result.data.error || "Failed to fetch form data")
          } else {
            throw new Error(result.error || "Failed to fetch form data")
          }
        }

        // Parse the JSON response carefully
        const result = await safeJsonParse(response)

        if (!result.success) {
          throw new Error(result.error || "Failed to parse form data")
        }

        const data = result.data
        console.log("Form data response:", data)

        setFormFields(data.questions || [])
        setEventTitle(data.eventTitle || "Static Test Form")
      } catch (error) {
        console.error("Error fetching static form data:", error)
        setError(error.message || "Failed to load form. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchStaticForm()
    }
  }, [eventId, retryCount])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
    setError("")
    setLoading(true)
  }

  const toggleDebug = () => {
    setShowDebug(!showDebug)
  }

  const handleSubmit = async (formData) => {
    try {
      setSubmitting(true)
      console.log(`Submitting form data:`, formData)

      // Simulate form submission
      await new Promise((resolve) => setTimeout(resolve, 1000))

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
          <h1 className="text-2xl font-bold">Loading Static Form...</h1>
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
          <h1 className="text-2xl font-bold">Error Loading Static Form</h1>
        </div>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <p className="font-medium text-amber-700">Technical Error</p>
            </div>
            <p className="text-gray-700 mb-4">{error}</p>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button onClick={handleRetry} className="mb-2 sm:mb-0">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button asChild>
                <Link href={`/events/${eventId}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Event
                </Link>
              </Button>
              <Button variant="outline" onClick={toggleDebug} className="ml-auto">
                <Bug className="mr-2 h-4 w-4" />
                {showDebug ? "Hide Debug Info" : "Show Debug Info"}
              </Button>
            </div>

            {showDebug && debugInfo && (
              <div className="mt-4 p-3 bg-gray-100 rounded-md overflow-auto max-h-96">
                <h3 className="font-medium mb-2">Debug Information</h3>
                <pre className="text-xs whitespace-pre-wrap break-words">{debugInfo}</pre>
              </div>
            )}
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
          title="Form Submitted Successfully"
          description="Thank you for your submission. This is a test form, so no actual data was saved."
          backUrl={`/events/${eventId}`}
          backLabel="Back to Event"
        />
      </div>
    )
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
        <h2 className="text-xl font-semibold mb-2">Static Test Form</h2>
        <p className="text-muted-foreground">This is a static test form to diagnose JSON parsing issues.</p>
      </div>

      {formFields.length > 0 ? (
        <DynamicForm
          formFields={formFields}
          formTitle="Static Test Form"
          formDescription="This form is for testing purposes only."
          onSubmit={handleSubmit}
          submitButtonText="Submit Test Form"
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
