"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EventDetailsForm } from "@/components/events/event-details-form"
import { TicketManagementForm } from "@/components/events/ticket-management-form"
import { CustomQuestionsForm } from "@/components/events/custom-questions-form"
import { EventPreview } from "@/components/events/event-preview"
import { EventCreationSuccess } from "@/components/events/event-creation-success"
import { motion, AnimatePresence } from "framer-motion"
import { SectionHeading } from "@/components/ui/section-heading"
import { DecorativeBlob } from "@/components/ui/decorative_blob"
import { CheckCircle2, ChevronLeft, ChevronRight, Rocket, LinkIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useSession } from "next-auth/react"
import { logWithTimestamp } from "@/utils/logger"
interface EventCreationFormProps {
  existingEvent?: any;
  isEditing?: boolean;
  setDataChanged?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function EventCreationForm({ existingEvent = null, isEditing = false, setDataChanged=() => {} }: EventCreationFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState("details")
  const [formData, setFormData] = useState({
    details: {
      title: "",
      displayName: "",
      type: "Offline",
      visibility: "Public",
      date: "",
      endDate: "",
      startTime: "",
      endTime: "",
      location: "",
      category: "",
      description: "",
      image: "",
      desktopCoverImage: null,
      mobileCoverImage: null,
      slug: "",
      onlineLink: "", // Added onlineLink
    },
    tickets: [{
      name: "General Admission",
      description: "Standard entry ticket",
      price: 0,
      quantity: 100,
      ticketType: "Free",
      ticketNumber: `TKT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().substring(9)}`,
      userId: "",
    }],
    customQuestions: {
      attendee: [],
      volunteer: [],
      speaker: [],
    },
    status: "draft",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedEventId, setSubmittedEventId] = useState("")
  const [submittedEventSlug, setSubmittedEventSlug] = useState("")
  const [publishStatus, setPublishStatus] = useState("draft")
  const [showUrlDialog, setShowUrlDialog] = useState(false)
  const [publicUrls, setPublicUrls] = useState({
    eventUrl: "",
    registerUrl: "",
    volunteerUrl: "",
    speakerUrl: "",
  })

  const [formStatus, setFormStatus] = useState({
    attendee: "published",
    volunteer: "published",
    speaker: "published",
  })

  // Load existing event data if editing
  useEffect(() => {
    if (existingEvent) {
      console.log("Loading existing event data for editing:", existingEvent)

      // Convert the existing event data to the format expected by the form
      const convertedData = {
        details: {
          title: existingEvent.title || "",
          displayName: existingEvent.displayName || existingEvent.title || "",
          type: existingEvent.type || "Offline",
          visibility: existingEvent.visibility || "Public",
          date: existingEvent.date ? new Date(existingEvent.date).toISOString().split("T")[0] : "",
          startTime: existingEvent.startTime || "",
          endTime: existingEvent.endTime || "",
          endDate: existingEvent.endDate
            ? new Date(existingEvent.endDate).toISOString().split("T")[0]
            : existingEvent.date
              ? new Date(existingEvent.date).toISOString().split("T")[0]
              : "",
          location: existingEvent.location || "",
          description: existingEvent.description || "",
          image: existingEvent.image || "",
          desktopCoverImage: null,
          mobileCoverImage: null,
          slug: existingEvent.slug || "",
          category: existingEvent.category || "",
          onlineLink: existingEvent.onlineLink || "", // Load existing onlineLink
        },
        tickets: Array.isArray(existingEvent.tickets)
          ? existingEvent.tickets.map((ticket) => ({
            ...ticket,
            price: ticket.price !== undefined ? ticket.price : 0,
            quantity: ticket.quantity !== undefined ? ticket.quantity : 0,
          }))
          : [],
        customQuestions: existingEvent.customQuestions || { attendee: [], volunteer: [], speaker: [] },
        status: existingEvent.status || "draft",
      }

      console.log("Converted form data:", convertedData)
      setFormData(convertedData)

      // Set form status from existing event
      setFormStatus({
        attendee: existingEvent.attendeeForm?.status || "draft",
        volunteer: existingEvent.volunteerForm?.status || "draft",
        speaker: existingEvent.speakerForm?.status || "draft",
      })
    }
  }, [existingEvent])

  const updateFormData = (section, data) => {
    setFormData((prev) => ({
      ...prev,
      [section]: data,
    }))
  }

  const updateFormStatus = (formType, status) => {
    console.log(`Updating form status: ${formType} -> ${status}`)
    setFormStatus((prev) => ({
      ...prev,
      [formType]: status,
    }))
  }

  const validateDetailsForm = () => {
    const details = formData.details
    logWithTimestamp("info", "Validating details form:", details)
    const missingFields = []
    const invalidFields = []

    if (!details.title?.trim()) missingFields.push("Event Title")
    // if (!details.displayName) missingFields.push("Event Display Name")
    if (!details.date) missingFields.push("Start Date")
    if (!details.startTime) missingFields.push("Start Time")
    if (!details.endDate) missingFields.push("End Date")
    if (!details.endTime) missingFields.push("End Time")
    if (!details.description?.trim()) missingFields.push("Event Description")
    if (!details.image?.trim()) {
      missingFields.push("Image URL")
    } else if (!details.image.match(/^https?:\/\/.+/)) {
      invalidFields.push("Image URL (must be a valid URL starting with http:// or https://)")
    }

    if (!details.category?.trim()) missingFields.push("Category")

    // Check venue details for offline or hybrid events
    if (details.type === "Offline" || details.type === "Hybrid") {
      if (!details.location?.trim()) missingFields.push("Location (for Offline/Hybrid event)")
    }

    // Check online link for online or hybrid events
    if (details.type === "Online" || details.type === "Hybrid") {
      if (!details.onlineLink?.trim()) {
        missingFields.push("Virtual Meeting Link (for Online/Hybrid event)")
      } else if (!details.onlineLink.match(/^https?:\/\/.+/)) {
        invalidFields.push("Virtual Meeting Link (must be a valid URL starting with http:// or https://)")
      }
    }

    // Date validation: endDate should not be before startDate
    if (details.date && details.endDate) {
      const startDate = new Date(details.date)
      const endDate = new Date(details.endDate)
      if (endDate < startDate) {
        invalidFields.push("End Date (cannot be earlier than Start Date)")
      }
    }

    // Combine missing and invalid fields for the toast message
    return { missing: missingFields, invalid: invalidFields }
  }

  const handleNext = () => {
    if (activeTab === "details") {
      const missingFields = validateDetailsForm()

      // if (missingFields.length > 0) {
      if (missingFields.missing.length > 0 || missingFields.invalid.length > 0) {
        let description = ""
        if (missingFields.missing.length > 0) {
          description += `Please fill in the following fields: ${missingFields.missing.join(", ")}. `
        }
        if (missingFields.invalid.length > 0) {
          description += `Please correct the following fields: ${missingFields.invalid.join(", ")}.`
        }
        toast({
          title: "Validation Error",
          description: description.trim(),
          variant: "destructive",
        })
        return
      }
      if (formData.details.visibility === "Private") {
        toast({
          title: "Premium Feature",
          description: "Private events are a premium feature. Your event will be set to Public.",
          variant: "default",
        })
        formData.details.visibility = "Public" // Force to Public
        return
      }

      setActiveTab("tickets")
    } else if (activeTab === "tickets") {
      // Validate that at least one ticket exists
      if (formData.tickets.length === 0) {
        toast({
          title: "Ticket Required",
          description: "Please add at least one ticket type before proceeding.",
          variant: "destructive",
        })
        return
      }
      setActiveTab("questions")
    } else if (activeTab === "questions") {
      // Check if at least one form is published
      if (
        formStatus.attendee !== "published" &&
        formStatus.volunteer !== "published" &&
        formStatus.speaker !== "published"
      ) {
        toast({
          title: "No Form Published",
          description: "Please publish at least one form (Attendee, Volunteer, or Speaker) before proceeding.",
          variant: "destructive",
        })
        return
      }
      setActiveTab("preview")
    }
  }

  const handleBack = () => {
    if (activeTab === "tickets") {
      setActiveTab("details")
    } else if (activeTab === "questions") {
      setActiveTab("tickets")
    } else if (activeTab === "preview") {
      setActiveTab("questions")
    }
  }

  const handleSubmit = async (status = "published") => {
    setIsSubmitting(true)
    setPublishStatus(status)

    try {
      // Ensure all required fields are present
      if (!formData.details.title) {
        throw new Error("Event name is required")
      }

      if (!formData.details.image) {
        throw new Error("Image URL is required")
      }

      if (!formData.details.image.match(/^https?:\/\/.+/)) {
        throw new Error("Image URL must start with http:// or https://")
      }

      // Get the current user ID from the session
      const userId = session?.user?.id || null
      if (!userId) {
        console.warn("User ID not found in session, using fallback")
      }

      // Convert form data to the format expected by the API
      const apiData = {
        details: {
          title: formData.details.title,
          displayName: formData.details.displayName || formData.details.title,
          description: formData.details.description || "",
          date: formData.details.date,
          startTime: formData.details.startTime,
          endTime: formData.details.endTime,
          endDate: formData.details.endDate,
          location: formData.details.location,
          category: formData.details.category || "",
          type: formData.details.type,
          visibility: formData.details.visibility || "Public", // Default to Public if not specified
          image: formData.details.image,
          onlineLink: formData.details.onlineLink || "", // Include onlineLink
          slug:
            formData.details.slug ||
            formData.details.title
              .toLowerCase()
              .replace(/[^\w\s-]/g, "")
              .replace(/\s+/g, "-")
              .replace(/-+/g, "-")
              .trim() ||
            `event-${Date.now()}`,
          customQuestions: {
            attendee: Array.isArray(formData.customQuestions.attendee) ? formData.customQuestions.attendee : [],
            volunteer: Array.isArray(formData.customQuestions.volunteer) ? formData.customQuestions.volunteer : [],
            speaker: Array.isArray(formData.customQuestions.speaker) ? formData.customQuestions.speaker : [],
          },
          status: status, // This will be "published" or "draft" based on the button clicked
          attendeeForm: { status: formStatus.attendee },
          volunteerForm: { status: formStatus.volunteer },
          speakerForm: { status: formStatus.speaker },
        },
        tickets:
          formData.tickets.map((ticket, index) => {
            console.log("Processing ticket:", ticket)
            // Generate a unique ticket number if not provided
            const ticketNumber = ticket.ticketNumber || `TICKET-${Date.now()}-${index}`

            return {
              ...ticket,
              // Ensure numeric values are properly formatted
              price: ticket.price ? Number(ticket.price) : 0,
              quantity: ticket.quantity ? Number(ticket.quantity) : 0,
              // Add required fields
              ticketNumber: ticketNumber,
              userId: userId || "system-generated",
            }
          }) || [],
      }

      console.log("Submitting event data:", apiData)
      console.log("Form status:", formStatus)

      // return;

      const url = isEditing ? `/api/events/${existingEvent.id}` : "/api/events/create"

      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      })

      logWithTimestamp("info", "API response:", response)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }))
        console.error("API Error Response:", errorData)

        // Handle validation errors specifically
        if (errorData.details && Array.isArray(errorData.details)) {
          throw new Error(`Validation errors: ${errorData.details.join(", ")}`)
        }

        throw new Error(
          errorData.error || `Failed to ${isEditing ? "update" : "create"} event (Status: ${response.status})`,
        )
      }

      const data = await response.json()

      const eventId = data.event?.id || data.event?._id || "event-123" // Fallback ID for testing
      const eventSlug = data.event?.slug || formData.details.slug // Store the slug for the success page

      setSubmittedEventId(eventId)
      setSubmittedEventSlug(eventSlug)
      setDataChanged((prev: boolean) => !prev);

      // Generate public URLs
      const baseUrl = window.location.origin
      setPublicUrls({
        eventUrl: `${baseUrl}/events/${eventSlug}`,
        registerUrl: `${baseUrl}/events/${eventSlug}/register`,
        volunteerUrl: `${baseUrl}/events/${eventSlug}/volunteer`,
        speakerUrl: `${baseUrl}/events/${eventSlug}/speaker`,
      })

      // Show URL dialog if published
      if (status === "published") {
        setShowUrlDialog(true)
      } else {
        setIsSubmitted(true)
      }

      // Always show a toast notification for successful event creation/update
      toast({
        title: isEditing
          ? status === "published"
            ? "Event updated and published!"
            : "Event updated as draft"
          : status === "published"
            ? "Event published successfully!"
            : "Event saved as draft",
        description:
          status === "published"
            ? "Your event is now live and ready to be shared."
            : "Your event has been saved as a draft and can be published later.",
      })
    } catch (error) {
      console.error(`Error ${isEditing ? "updating" : "creating"} event:`, error)
      toast({
        title: `Error ${isEditing ? "updating" : "creating"} event`,
        description: error.message || `An error occurred while ${isEditing ? "updating" : "creating"} your event.`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStepNumber = () => {
    switch (activeTab) {
      case "details":
        return 1
      case "tickets":
        return 2
      case "questions":
        return 3
      case "preview":
        return 4
      default:
        return 1
    }
  }

  const totalSteps = 4
  const progress = (getStepNumber() / totalSteps) * 100

  // Update the handleCustomQuestionsUpdate function to include form status
  const handleCustomQuestionsUpdate = (questions) => {
    setFormData((prev) => ({
      ...prev,
      customQuestions: questions,
    }))
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "URL Copied",
      description: "The URL has been copied to your clipboard.",
      variant: "success",
    })
  }

  return (
    <div className="relative">
      <DecorativeBlob
        className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] opacity-20 blur-3xl"
        color="var(--primary)"
      />
      <DecorativeBlob
        className="absolute bottom-[-100px] left-[-100px] w-[300px] h-[300px] opacity-10 blur-3xl"
        color="var(--secondary)"
      />

      {/* URL Dialog */}
      <Dialog
        open={showUrlDialog}
        onOpenChange={(open) => {
          setShowUrlDialog(open)
          if (!open) setIsSubmitted(true)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Event Published Successfully!</DialogTitle>
            <DialogDescription>Your event has been published. Share these links with your audience.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Event Page:</p>
              <div className="flex items-center gap-2">
                <Input value={publicUrls.eventUrl} readOnly className="flex-1" />
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(publicUrls.eventUrl)}>
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Registration Form:</p>
              <div className="flex items-center gap-2">
                <Input value={publicUrls.registerUrl} readOnly className="flex-1" />
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(publicUrls.registerUrl)}>
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {formStatus.volunteer === "published" && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Volunteer Application:</p>
                <div className="flex items-center gap-2">
                  <Input value={publicUrls.volunteerUrl} readOnly className="flex-1" />
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(publicUrls.volunteerUrl)}>
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {formStatus.speaker === "published" && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Speaker Application:</p>
                <div className="flex items-center gap-2">
                  <Input value={publicUrls.speakerUrl} readOnly className="flex-1" />
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(publicUrls.speakerUrl)}>
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setShowUrlDialog(false)
                setIsSubmitted(true)
              }}
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isSubmitted ? (
        <EventCreationSuccess
          eventId={submittedEventId}
          eventName={formData.details.title || "New Event"}
          eventSlug={submittedEventSlug}
          isEditing={isEditing}
          isPublished={publishStatus === "published"}
        />
      ) : (
        <>
          <SectionHeading
            title={isEditing ? "Edit Your Event" : "Create Your Event"}
            description={
              isEditing
                ? "Update your event details below"
                : "Fill out the details below to create a new event that will wow your attendees."
            }
          // className="mb-8"
          />

          <Card className="border-0 shadow-lg overflow-hidden relative z-10">
            <div className="h-2 w-full bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-secondary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4].map((step) => (
                      <motion.div
                        key={step}
                        className={`flex items-center justify-center w-8 h-8 rounded-full cursor-pointer ${step <= getStepNumber() ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                          }`}
                        initial={{ scale: 0.8 }}
                        animate={{
                          scale: step === getStepNumber() ? 1.1 : 1,
                          backgroundColor: step <= getStepNumber() ? "var(--primary)" : "hsl(var(--muted))",
                          color: step <= getStepNumber() ? "white" : "hsl(var(--muted-foreground))",
                        }}
                        transition={{ duration: 0.3 }}
                        onClick={() => {
                          // Allow clicking on previous steps
                          if (step < getStepNumber()) {
                            switch (step) {
                              case 1:
                                setActiveTab("details")
                                break
                              case 2:
                                setActiveTab("tickets")
                                break
                              case 3:
                                setActiveTab("questions")
                                break
                              case 4:
                                setActiveTab("preview")
                                break
                            }
                          }
                        }}
                      >
                        {step < getStepNumber() ? <CheckCircle2 className="h-5 w-5" /> : <span>{step}</span>}
                      </motion.div>
                    ))}
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-sm">
                      Step {getStepNumber()} of {totalSteps}:
                      <span className="ml-1 text-primary">
                        {activeTab === "details" && "Event Details"}
                        {activeTab === "tickets" && "Ticket Management"}
                        {activeTab === "questions" && "Custom Questions"}
                        {activeTab === "preview" && "Preview & Publish"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === "details" && (
                    <EventDetailsForm
                      data={formData.details}
                      updateData={(data) => updateFormData("details", data)}
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      formData={formData}
                      setFormData={setFormData}
                      toast={toast}
                      handleNext={handleNext}
                    />
                  )}

                  {activeTab === "tickets" && (
                    <TicketManagementForm
                      initialData={formData.tickets}
                      updateData={(data) => updateFormData("tickets", data)}
                      eventId={isEditing ? existingEvent.id : null}
                      handleNext={handleNext}
                    />
                  )}

                  {activeTab === "questions" && (
                    <CustomQuestionsForm
                      data={formData.customQuestions}
                      updateData={handleCustomQuestionsUpdate}
                      eventId={isEditing ? existingEvent._id : null}
                      updateFormStatus={updateFormStatus}
                      formStatus={formStatus}
                    />
                  )}

                  {activeTab === "preview" && <EventPreview formData={formData} />}
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-between mt-8">
                {activeTab !== "details" ? (
                  <Button variant="default" onClick={handleBack} className="button-hover" style={{ zIndex: 9999 }}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                ) : (
                  <div></div>
                )}

                {activeTab !== "preview" ? (
                  <Button onClick={handleNext} className="button-hover bg-gradient-to-r from-primary to-secondary">
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex gap-3">
                    {/* <Button
                      onClick={() => handleSubmit("draft")}
                      variant="outline"
                      className="button-hover"
                      disabled={isSubmitting}
                    >
                      {isSubmitting && publishStatus === "draft" ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-3 h-4 w-4 text-primary"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Saving as Draft...
                        </>
                      ) : (
                        <>
                          <svg
                            className="mr-2 h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M5 22h14"></path>
                            <path d="M5 2v14a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V7.5L14 2H5z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                          </svg>
                          {isEditing ? "Save as Draft" : "Save as Draft"}
                        </>
                      )}
                    </Button> */}
                    <Button
                      onClick={() => handleSubmit("published")}
                      className="button-hover bg-gradient-to-r from-primary to-secondary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting && publishStatus === "published" ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Rocket className="mr-2 h-4 w-4" />
                          {isEditing ? "Update & Publish" : "Publish Event"}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
