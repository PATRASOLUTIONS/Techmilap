"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function EventCreationForm({ existingEvent = null, isEditing = false }) {
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
    attendee: "draft",
    volunteer: "draft",
    speaker: "draft",
  })

  // Load existing event data if editing
  useEffect(() => {
    if (existingEvent) {
      console.log("Loading existing event data for editing:", existingEvent.title)
      console.log("Venue from existingEvent:", existingEvent.venue || existingEvent.location)

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
          venue: existingEvent.venue || existingEvent.location || "",
          description: existingEvent.description || "",
          coverImageUrl: existingEvent.image || "",
          desktopCoverImage: null,
          mobileCoverImage: null,
          slug: existingEvent.slug || "",
          category: existingEvent.category || "",
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
      console.log("Venue in converted data:", convertedData.details.venue)
      setFormData(convertedData)

      // Set form status from existing event
      const updatedFormStatus = {
        attendee: existingEvent.attendeeForm?.status || "draft",
        volunteer: existingEvent.volunteerForm?.status || "draft",
        speaker: existingEvent.speakerForm?.status || "draft",
      }

      console.log("Setting form status to:", updatedFormStatus)
      setFormStatus(updatedFormStatus)

      // Log custom questions count
      console.log("Custom questions loaded:", {
        attendee: (existingEvent.customQuestions?.attendee || []).length,
        volunteer: (existingEvent.customQuestions?.volunteer || []).length,
        speaker: (existingEvent.customQuestions?.speaker || []).length,
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
        description: error.message || `An error occurred while ${isEditing ? "updating" : "creating"} event`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }
}
