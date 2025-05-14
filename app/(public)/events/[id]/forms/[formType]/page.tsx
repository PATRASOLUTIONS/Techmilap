"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Calendar, Clock, MapPin, Users, Info, ArrowRight, PartyPopper, Frown } from "lucide-react"
import { format } from "date-fns"
import { GradientCard } from "@/components/ui/gradient-card"

async function getFormData(eventId: string, formType: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events/${eventId}/forms/${formType}`, {
      cache: "no-store",
    })

    if (!res.ok) {
      // Try to get more detailed error information
      try {
        const errorData = await res.json()
        throw new Error(errorData.message || `Failed to fetch form data. Status: ${res.status}`)
      } catch (parseError) {
        // If we can't parse the error as JSON, use the status text
        throw new Error(`Failed to fetch form data. Status: ${res.status} ${res.statusText}`)
      }
    }

    return res.json()
  } catch (error: any) {
    console.error("Error fetching form data:", error)
    throw new Error(`Failed to fetch form data: ${error.message}`)
  }
}

// Debug endpoint to test the API
async function testDebugEndpoint(eventId: string, formType: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events/${eventId}/debug`, {
      cache: "no-store",
    })

    if (!res.ok) {
      return { error: `Status: ${res.status} ${res.statusText}` }
    }

    try {
      return await res.json()
    } catch (e) {
      return { error: "Server returned HTML instead of JSON. This might indicate a server error." }
    }
  } catch (error: any) {
    return { error: error.message }
  }
}

// Function to check if an event has passed
function checkEventPassed(eventData: any) {
  try {
    const now = new Date()
    const eventDate = eventData.date ? new Date(eventData.date) : null

    // If no date is set, consider the event as not passed
    if (!eventDate) {
      return {
        passed: false,
        message: "No event date set",
        debug: { now, eventDate: null },
      }
    }

    // Compare dates (ignoring time)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())

    // If event date is in the future, it hasn't passed
    if (eventDay > today) {
      return {
        passed: false,
        message: "Event date is in the future",
        debug: { now, today, eventDate, eventDay, comparison: "eventDay > today" },
      }
    }

    // If event date is in the past, it has passed
    if (eventDay < today) {
      return {
        passed: true,
        message: "Event date is in the past",
        debug: { now, today, eventDate, eventDay, comparison: "eventDay < today" },
      }
    }

    // If we're on the event day, check the time if available
    if (eventData.startTime) {
      const [hours, minutes] = eventData.startTime.split(":").map(Number)
      const eventDateTime = new Date(eventDate)
      eventDateTime.setHours(hours, minutes, 0, 0)

      if (now > eventDateTime) {
        return {
          passed: true,
          message: "Event has already started today",
          debug: { now, eventDateTime, comparison: "now > eventDateTime" },
        }
      } else {
        return {
          passed: false,
          message: "Event is today but hasn't started yet",
          debug: { now, eventDateTime, comparison: "now <= eventDateTime" },
        }
      }
    }

    // If no start time is set but it's the event day, consider it not passed
    // This gives the benefit of doubt for the full day
    return {
      passed: false,
      message: "Event is today (no specific start time)",
      debug: { now, today, eventDate, eventDay, comparison: "eventDay === today, no startTime" },
    }
  } catch (error: any) {
    console.error("Error checking if event has passed:", error)
    return {
      passed: false,
      message: `Error checking event date: ${error.message}`,
      debug: { error: error.message },
    }
  }
}

export default async function FormPage({ params }: { params: { id: string; formType: string } }) {
  const { id, formType } = params

  try {
    // Fetch form data
    const formData = await getFormData(id, formType)

    // Test debug endpoint
    const debugResult = await testDebugEndpoint(id, formType)

    // Check if the event has passed
    const eventPassedCheck = checkEventPassed(formData.event)
    const eventHasPassed = eventPassedCheck.passed

    // Format the event date
    const eventDate = formData.event.date ? new Date(formData.event.date) : null
    const formattedDate = eventDate ? format(eventDate, "EEEE, MMMM d, yyyy") : "Date not set"

    // Format the event time
    const formattedTime = formData.event.startTime
      ? `${formData.event.startTime}${formData.event.endTime ? ` - ${formData.event.endTime}` : ""}`
      : "Time not specified"

    // Get the form title based on the form type
    const getFormTitle = () => {
      switch (formType) {
        case "register":
          return "Registration Form"
        case "volunteer":
          return "Volunteer Application"
        case "speaker":
          return "Speaker Application"
        default:
          return "Application Form"
      }
    }

    // If the form is not published, show a message
    if (!formData.isPublished) {
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

    // If the event has passed, show a message
    if (eventHasPassed) {
      return (
        <div className="container max-w-4xl py-10">
          <Card className="overflow-hidden">
            <CardHeader className="bg-brand-blue text-white">
              <CardTitle>{getFormTitle()} - Event Has Passed</CardTitle>
              <CardDescription className="text-white/80">This event has already started or ended</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                {/* Animated character */}
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
                  But there are more exciting events coming up! Browse our upcoming events and find your next
                  opportunity.
                </p>

                <div className="space-y-4 w-full max-w-md">
                  <GradientCard
                    gradientFrom="from-brand-blue/10"
                    gradientTo="to-brand-light-blue/20"
                    className="w-full"
                  >
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

                      {formData.event.location && (
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <MapPin className="h-5 w-5 text-brand-orange" />
                          </div>
                          <div>
                            <p className="font-medium">Location</p>
                            <p className="text-sm text-gray-600">{formData.event.location}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </GradientCard>

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

                {/* Collapsible debug section */}
                <div className="w-full max-w-md mt-8">
                  <Tabs defaultValue="date-check">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="date-check" className="text-xs">
                        Date Comparison Details
                      </TabsTrigger>
                      <TabsTrigger value="debug" className="text-xs">
                        Technical Debug Info
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="date-check" className="mt-2">
                      <Card>
                        <CardHeader className="py-3">
                          <CardTitle className="text-sm flex items-center">
                            <Info className="h-4 w-4 mr-2 text-brand-light-blue" />
                            Date Comparison Results
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                          <div className="text-xs space-y-2 font-mono bg-gray-50 p-2 rounded border">
                            <div>
                              <strong>Result:</strong> {eventPassedCheck.message}
                            </div>
                            <div>
                              <strong>Current Time:</strong> {new Date().toLocaleString()}
                            </div>
                            <div>
                              <strong>Event Date:</strong> {eventDate?.toLocaleString() || "Not set"}
                            </div>
                            {eventPassedCheck.debug && (
                              <pre className="whitespace-pre-wrap overflow-x-auto">
                                {JSON.stringify(eventPassedCheck.debug, null, 2)}
                              </pre>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="debug" className="mt-2">
                      <Card>
                        <CardHeader className="py-3">
                          <CardTitle className="text-sm flex items-center">
                            <Info className="h-4 w-4 mr-2 text-brand-light-blue" />
                            Technical Debug Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                          <div className="text-xs space-y-2 font-mono bg-gray-50 p-2 rounded border">
                            <div>
                              <strong>Form Type:</strong> {formType}
                            </div>
                            <div>
                              <strong>Event ID:</strong> {id}
                            </div>
                            <div>
                              <strong>Is Published:</strong> {formData.isPublished ? "Yes" : "No"}
                            </div>
                            <Separator className="my-2" />
                            <div className="font-semibold">Debug Endpoint Test:</div>
                            <pre className="whitespace-pre-wrap overflow-x-auto">
                              {JSON.stringify(debugResult, null, 2)}
                            </pre>
                          </div>
                        </CardContent>
                        <CardFooter className="py-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs w-full border-brand-light-blue/30 text-brand-light-blue"
                            onClick={() => window.location.reload()}
                          >
                            Refresh Form Status
                          </Button>
                        </CardFooter>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    // Render the form
    return (
      <div className="container max-w-4xl py-10">
        <Card>
          <CardHeader className="bg-brand-blue text-white">
            <CardTitle>
              {getFormTitle()} for {formData.event.title}
            </CardTitle>
            <CardDescription className="text-white/80">
              Please fill out the form below to {formType === "register" ? "register" : "apply"} for this event
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

                  {formData.event.location && (
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <MapPin className="h-5 w-5 text-brand-orange" />
                      </div>
                      <div>
                        <p className="font-medium">Location</p>
                        <p className="text-sm text-gray-600">{formData.event.location}</p>
                      </div>
                    </div>
                  )}

                  {formData.event.capacity && (
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Users className="h-5 w-5 text-brand-light-blue" />
                      </div>
                      <div>
                        <p className="font-medium">Capacity</p>
                        <p className="text-sm text-gray-600">{formData.event.capacity} attendees</p>
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
                      {formType === "register"
                        ? "Please complete this registration form to secure your spot at the event."
                        : formType === "volunteer"
                          ? "Thank you for your interest in volunteering. Please complete this application form."
                          : "Thank you for your interest in speaking at this event. Please complete this application form."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form would be rendered here */}
            <div className="text-center py-10">
              <p className="text-gray-500 italic">Form content would be rendered here</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button variant="outline" asChild>
              <Link href={`/events/${id}`}>Cancel</Link>
            </Button>
            <Button className="bg-brand-blue hover:bg-brand-blue/90">Submit Application</Button>
          </CardFooter>
        </Card>
      </div>
    )
  } catch (error: any) {
    console.error("Error in form page:", error)

    // Check if it's a database connection error
    const isDbConnectionError =
      error.message &&
      (error.message.includes("database connection") ||
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("MongoNetworkError") ||
        error.message.includes("failed to connect"))

    if (isDbConnectionError) {
      return (
        <div className="container max-w-4xl py-10">
          <Card>
            <CardHeader className="bg-brand-blue text-white">
              <CardTitle>Database Connection Error</CardTitle>
              <CardDescription className="text-white/80">
                We're having trouble connecting to our database
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="rounded-full bg-brand-orange/20 p-3 mb-4">
                  <AlertCircle className="h-6 w-6 text-brand-orange" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-brand-blue">Database Connection Error</h3>
                <p className="text-gray-600 max-w-md mb-6">
                  We're currently experiencing issues connecting to our database. This is likely a temporary problem.
                  Please try again in a few moments.
                </p>
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

                <div className="mt-8 w-full max-w-md p-4 border rounded-lg bg-gray-50">
                  <p className="text-sm font-medium text-gray-700 mb-2">Error details:</p>
                  <p className="text-xs text-gray-600 font-mono break-all">{error.message}</p>

                  <div className="mt-4 text-xs text-gray-500">
                    <p className="font-medium">Troubleshooting tips:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Check your internet connection</li>
                      <li>Try refreshing the page</li>
                      <li>Clear your browser cache</li>
                      <li>Try again in a few minutes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    // For other errors, show a generic error message
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
              <p className="text-gray-600 max-w-md mb-6">
                We encountered an error while trying to load this form. This could be due to a temporary issue or the
                form may no longer be available.
              </p>
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

              <div className="mt-8 w-full max-w-md p-4 border rounded-lg bg-gray-50">
                <p className="text-sm font-medium text-gray-700 mb-2">Error details:</p>
                <p className="text-xs text-gray-600 font-mono break-all">{error.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
}
