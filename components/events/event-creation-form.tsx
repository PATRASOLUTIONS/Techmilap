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
import { CheckCircle2, ChevronLeft, ChevronRight, Rocket, Save, LinkIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export function EventCreationForm({
  existingEvent = null,
  isEditing = false,
  initialFormStatus = { attendee: "draft", volunteer: "draft", speaker: "draft" },
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("details")
  const [formData, setFormData] = useState({
    details: {
      name: "",
      displayName: "",
      type: "Offline",
      visibility: "Public",
      startDate: "",
      startTime: "",
      endTime: "",
      endDate: "",
      venue: "",
      address: "",
      description: "",
      coverImageUrl: "",
      desktopCoverImage: null,
      mobileCoverImage: null,
      slug: "",
    },
    tickets: [],
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
    attendee: initialFormStatus?.attendee || "draft",
    volunteer: initialFormStatus?.volunteer || "draft",
    speaker: initialFormStatus?.speaker || "draft",
  })

  // Load existing event data if editing
  useEffect(() => {
    if (existingEvent) {
      console.log("Loading existing event data for editing:", existingEvent.title)
      console.log(
        "Ticket data:",
        existingEvent.tickets ? `${existingEvent.tickets.length} tickets found` : "No tickets found",
      )

      // Convert the existing event data to the format expected by the form
      const convertedData = {
        details: {
          name: existingEvent.title || "",
          displayName: existingEvent.displayName || existingEvent.title || "",
          type: existingEvent.type || "Offline",
          visibility: existingEvent.visibility || "Public",
          startDate: existingEvent.date ? new Date(existingEvent.date).toISOString().split("T")[0] : "",
          startTime: existingEvent.startTime || "",
          endTime: existingEvent.endTime || "",
          endDate: existingEvent.endDate
            ? new Date(existingEvent.endDate).toISOString().split("T")[0]
            : existingEvent.date
              ? new Date(existingEvent.date).toISOString().split("T")[0]
              : "",
          venue: existingEvent.venue || "",
          address: existingEvent.location || "",
          description: existingEvent.description || "",
          coverImageUrl: existingEvent.image || "",
          desktopCoverImage: null,
          mobileCoverImage: null,
          slug: existingEvent.slug || "",
        },
        tickets: Array.isArray(existingEvent.tickets) ? existingEvent.tickets : [],
        customQuestions: existingEvent.customQuestions || { attendee: [], volunteer: [], speaker: [] },
        status: existingEvent.status || "draft",
      }

      setFormData(convertedData)

      // Set form status from existing event
      setFormStatus({
        attendee: existingEvent.attendeeForm?.status || initialFormStatus.attendee || "draft",
        volunteer: existingEvent.volunteerForm?.status || initialFormStatus.volunteer || "draft",
        speaker: existingEvent.speakerForm?.status || initialFormStatus.speaker || "draft",
      })

      // If editing, start on the tickets tab if requested
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get("tab") === "tickets") {
        setActiveTab("tickets")
      }
    }
  }, [existingEvent, initialFormStatus])

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
    const missingFields = []

    if (!details.name) missingFields.push("Event Name")
    if (!details.displayName) missingFields.push("Event Display Name")
    if (!details.startDate) missingFields.push("Start Date")
    if (!details.startTime) missingFields.push("Start Time")
    if (!details.endDate) missingFields.push("End Date")
    if (!details.endTime) missingFields.push("End Time")
    if (!details.description) missingFields.push("Event Description")

    // Check venue details for offline or hybrid events
    if (details.type === "Offline" || details.type === "Hybrid") {
      if (!details.venue) missingFields.push("Venue Name")
      if (!details.address) missingFields.push("Venue Address")
    }

    return missingFields
  }

  const handleNext = () => {
    if (activeTab === "details") {
      const missingFields = validateDetailsForm()

      if (missingFields.length > 0) {
        toast({
          title: "Required Fields Missing",
          description: `Please fill in the following fields: ${missingFields.join(", ")}`,
          variant: "destructive",
        })
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
      if (!formData.details.name) {
        throw new Error("Event name is required")
      }

      // Convert form data to the format expected by the API
      const apiData = {
        details: {
          name: formData.details.name,
          displayName: formData.details.displayName || formData.details.name,
          description: formData.details.description || "",
          startDate: formData.details.startDate,
          startTime: formData.details.startTime,
          endTime: formData.details.endTime,
          endDate: formData.details.endDate,
          address: formData.details.address,
          venue: formData.details.venue,
          type: formData.details.type,
          visibility: formData.details.visibility || "Public", // Default to Public if not specified
          coverImageUrl: formData.details.coverImageUrl,
          slug:
            formData.details.slug ||
            formData.details.name
              .toLowerCase()
              .replace(/[^\w\s-]/g, "")
              .replace(/\s+/g, "-")
              .replace(/-+/g, "-")
              .trim() ||
            `event-${Date.now()}`,
        },
        tickets:
          formData.tickets.map((ticket) => ({
            ...ticket,
            // Ensure numeric values are properly formatted
            price: ticket.price ? Number(ticket.price) : 0,
            quantity: ticket.quantity ? Number(ticket.quantity) : 0,
          })) || [],
        customQuestions: {
          attendee: Array.isArray(formData.customQuestions.attendee) ? formData.customQuestions.attendee : [],
          volunteer: Array.isArray(formData.customQuestions.volunteer) ? formData.customQuestions.volunteer : [],
          speaker: Array.isArray(formData.customQuestions.speaker) ? formData.customQuestions.speaker : [],
        },
        status: status, // This will be "published" or "draft" based on the button clicked
        attendeeForm: { status: formStatus.attendee },
        volunteerForm: { status: formStatus.volunteer },
        speakerForm: { status: formStatus.speaker },
      }

      console.log("Submitting event data:", apiData)
      console.log("Form status:", formStatus)

      const url = isEditing ? `/api/events/${existingEvent._id}` : "/api/events/create"

      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }))
        throw new Error(
          errorData.error || `Failed to ${isEditing ? "update" : "create"} event (Status: ${response.status})`,
        )
      }

      const data = await response.json()

      const eventId = data.event?.id || data.event?._id || "event-123" // Fallback ID for testing
      const eventSlug = data.event?.slug || formData.details.slug // Store the slug for the success page

      setSubmittedEventId(eventId)
      setSubmittedEventSlug(eventSlug)

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
        variant: "success",
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
          eventName={formData.details.name || "New Event"}
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
            className="mb-8"
          />

          <Card className="border-0 shadow-lg overflow-hidden">
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
                        className={`flex items-center justify-center w-8 h-8 rounded-full cursor-pointer ${
                          step <= getStepNumber() ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        }`}
                        initial={{ scale: 0.8 }}
                        animate={{
                          scale: step === getStepNumber() ? 1.1 : 1,
                          backgroundColor: step <= getStepNumber() ? "var(--primary)" : "hsl(var(--muted))",
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
                    <EventDetailsForm data={formData.details} updateData={(data) => updateFormData("details", data)} />
                  )}

                  {activeTab === "tickets" && (
                    <TicketManagementForm
                      data={formData.tickets}
                      updateData={(data) => updateFormData("tickets", data)}
                      eventId={isEditing ? existingEvent._id : null}
                    />
                  )}

                  {activeTab === "questions" && (
                    <CustomQuestionsForm
                      data={formData.customQuestions}
                      updateData={handleCustomQuestionsUpdate}
                      eventId={isEditing ? existingEvent._id : null}
                      updateFormStatus={updateFormStatus}
                      initialFormStatus={formStatus}
                    />
                  )}

                  {activeTab === "preview" && <EventPreview formData={formData} />}
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-between mt-8">
                {activeTab !== "details" ? (
                  <Button variant="outline" onClick={handleBack} className="button-hover">
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
                    <Button
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
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save as Draft
                        </>
                      )}
                    </Button>
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
