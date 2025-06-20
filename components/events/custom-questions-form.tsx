"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, Plus, GripVertical, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CustomQuestionsFormProps {
  data: { attendee: any[]; volunteer: any[]; speaker: any[] }
  updateData: (data: any) => void
  eventId?: string
  updateFormStatus?: (formType: string, status: string) => void
  formStatus?: { attendee: string; volunteer: string; speaker: string }
}

export function CustomQuestionsForm({
  data = { attendee: [], volunteer: [], speaker: [] },
  updateData,
  eventId = null,
  updateFormStatus,
  formStatus: initialFormStatus,
}: CustomQuestionsFormProps) {
  const [activeTab, setActiveTab] = useState("attendee")
  const { toast } = useToast()

  // Initialize questions state with empty arrays
  const [attendeeQuestions, setAttendeeQuestions] = useState([])
  const [volunteerQuestions, setVolunteerQuestions] = useState([])
  const [speakerQuestions, setSpeakerQuestions] = useState([])

  // Form publish status
  const [publishStatus, setPublishStatus] = useState({
    attendee: false,
    volunteer: false,
    speaker: false,
  })

  // Add a new state for tracking the published URLs
  const [publishedUrls, setPublishedUrls] = useState({
    attendee: "",
    volunteer: "",
    speaker: "",
  })

  // Form status state
  const [formStatus, setFormStatus] = useState({
    attendee: "draft",
    volunteer: "draft",
    speaker: "draft",
  })

  // Add state for loading indicators
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPublishing, setIsPublishing] = useState({
    attendee: false,
    volunteer: false,
    speaker: false,
  })

  // Add a ref to track if form status has been fetched
  const formStatusFetched = useRef(false)

  // Add a ref to prevent multiple simultaneous API calls
  const isApiCallInProgress = useRef(false)

  // Add a ref to track the last fetch time to prevent too frequent API calls
  const lastFetchTime = useRef(0)

  // Helper function to convert a label to a camelCase ID segment
  const labelToIdSegment = (label: string): string => {
    if (!label || typeof label !== 'string' || label.trim() === '') {
      return `untitled`; // Default segment if label is empty
    }
    const words = label.trim().toLowerCase().split(/\s+/);
    if (words.length === 0) return 'untitled';

    return words.map((word, index) => {
      if (index === 0) return word;
      // Special handling for "ID" to become "Id" in camelCase
      if (word.toUpperCase() === "ID" && index > 0) return "Id";
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join('');
  };

  // Helper function to generate a unique question ID
  const generateQuestionId = (label: string): string => {
    const labelSegment = labelToIdSegment(label);
    return `question_${labelSegment}_${Date.now()}`; // Timestamp generated here
  };
  const generateDefaultQuestions = useCallback(() => {
    const defaultAttendeeQuestions = [
      {
        id: `question_name_${Date.now()}`,
        type: "text",
        label: "Name",
        placeholder: "Enter your name",
        required: true,
      },
      {
        // id: generateQuestionId("Email ID"), // Will be set in map
        type: "email",
        label: "Email ID",
        placeholder: "Enter your email address",
        required: true,
      },
      {
        // id: generateQuestionId("Corporate Email ID"),
        type: "email",
        label: "Corporate Email ID",
        placeholder: "Enter your corporate email address",
        required: true,
      },
      {
        // id: generateQuestionId("Designation"),
        type: "text",
        label: "Designation",
        placeholder: "Enter your designation",
        required: true,
      },
      {
        // id: generateQuestionId("LinkedIn ID"),
        type: "text",
        label: "LinkedIn ID",
        placeholder: "Enter your LinkedIn profile URL",
        required: true,
      },
      {
        // id: generateQuestionId("GitHub ID"),
        type: "text",
        label: "GitHub ID",
        placeholder: "Enter your GitHub profile URL",
        required: true,
      },
      {
        // id: generateQuestionId("Any other social Media ID"),
        type: "text",
        label: "Any other social Media ID",
        placeholder: "Enter any other social media profile URL",
        required: false,
      },
      {
        // id: generateQuestionId("Mobile number"),
        type: "phone",
        label: "Mobile number",
        placeholder: "Enter your mobile number",
        required: true,
      },
    ].map(q => {
      return { ...q, id: generateQuestionId(q.label) }; // Use new generateQuestionId
    });

    const defaultVolunteerQuestions = [
      {
        // id: `question_name_${Date.now() + 10}`, // Will be set in map
        type: "text",
        label: "Name",
        placeholder: "Enter your name",
        required: true,
      },
      {
        // id: generateQuestionId("Email ID"),
        type: "email",
        label: "Email ID",
        placeholder: "Enter your email address",
        required: true,
      },
      {
        // id: generateQuestionId("Corporate Email ID"),
        type: "email",
        label: "Corporate Email ID",
        placeholder: "Enter your corporate email address",
        required: true,
      },
      {
        // id: generateQuestionId("Designation"),
        type: "text",
        label: "Designation",
        placeholder: "Enter your designation",
        required: true,
      },
      {
        // id: generateQuestionId("Event Organizer"),
        type: "text",
        label: "Event Organizer",
        placeholder: "Enter the event organizer",
        required: true,
      },
      {
        // id: generateQuestionId("Are you a Microsoft MVP?"),
        type: "checkbox",
        label: "Are you a Microsoft MVP?",
        required: true,
      },
      {
        // id: generateQuestionId("MVP ID"),
        type: "text",
        label: "MVP ID",
        placeholder: "Enter your MVP ID",
        required: false,
      },
      {
        // id: generateQuestionId("MVP Profile Link"),
        type: "text",
        label: "MVP Profile Link",
        placeholder: "Enter your MVP profile link",
        required: false,
      },
      {
        // id: generateQuestionId("MVP Category"),
        type: "text",
        label: "MVP Category",
        placeholder: "Enter your MVP category",
        required: false,
      },
      {
        // id: generateQuestionId("How many events have you supported as a volunteer?"),
        type: "select",
        label: "How many events have you supported as a volunteer?",
        placeholder: "Select the number of events",
        required: true,
        options: [
          { value: "1-5" },
          { value: "6-10" },
          { value: "11+" },
        ],
      },
      {
        // id: `question_meetupEventName_${Date.now() + 20}`,
        type: "text",
        label: "Meetup/Event Name",
        placeholder: "Enter the meetup/event name",
        required: true,
      },
      {
        // id: generateQuestionId("Event Details"),
        type: "textarea",
        label: "Event Details",
        placeholder: "Enter the event details",
        required: true,
      },
      {
        // id: generateQuestionId("Meetup page details"),
        type: "text",
        label: "Meetup page details",
        placeholder: "Enter the meetup page details",
        required: true,
      },
      {
        // id: generateQuestionId("Your Contribution"),
        type: "select",
        label: "Your Contribution",
        placeholder: "Select your contribution",
        required: true,
        options: [
          { id: "contribution_1", value: "Content creator" },
          { id: "contribution_2", value: "Social media" },
          { id: "contribution_3", value: "Event planner" },
          { id: "contribution_4", value: "Infographic designer" },
          { id: "contribution_5", value: "Organizer" },
        ],
      },
      {
        // id: generateQuestionId("Organizer Name/ LinkedIn ID"),
        type: "text",
        label: "Organizer Name/ LinkedIn ID",
        placeholder: "Enter the organizer name/ LinkedIn ID",
        required: true,
      },
      {
        // id: generateQuestionId("LinkedIn ID"),
        type: "text",
        label: "LinkedIn ID",
        placeholder: "Enter your LinkedIn profile URL",
        required: true,
      },
      {
        // id: generateQuestionId("GitHub ID"),
        type: "text",
        label: "GitHub ID",
        placeholder: "Enter your GitHub profile URL",
        required: true,
      },
      {
        // id: generateQuestionId("Any other social Media ID"),
        type: "text",
        label: "Any other social Media ID",
        placeholder: "Enter any other social media profile URL",
        required: false,
      },
      {
        // id: generateQuestionId("Mobile number"),
        type: "phone",
        label: "Mobile number",
        placeholder: "Enter your mobile number",
        required: true,
      },
    ].map(q => {
      const ts = Date.now() + Math.random(); // Unique timestamp
      const optionsWithIds = q.options?.map(opt => ({ ...opt, id: `option_${ts}_${Math.random().toString(36).substring(2, 7)}` })) || [];
      return { ...q, id: generateQuestionId(q.label), options: optionsWithIds }; // Use new generateQuestionId
    });

    const defaultSpeakerQuestions = [
      {
        // id: generateQuestionId("Name"), // Will be set in map
        type: "text",
        label: "Name",
        placeholder: "Enter your name",
        required: true,
      },
      {
        // id: generateQuestionId("Email ID"),
        type: "email",
        label: "Email ID",
        placeholder: "Enter your email address",
        required: true,
      },
      {
        // id: generateQuestionId("Corporate Email ID"),
        type: "email",
        label: "Corporate Email ID",
        placeholder: "Enter your corporate email address",
        required: true,
      },
      {
        // id: generateQuestionId("Designation"),
        type: "text",
        label: "Designation",
        placeholder: "Enter your designation",
        required: true,
      },
      {
        // id: generateQuestionId("Event Organizer"),
        type: "text",
        label: "Event Organizer",
        placeholder: "Enter the event organizer",
        required: true,
      },
      {
        // id: generateQuestionId("Are you a Microsoft MVP?"),
        type: "checkbox",
        label: "Are you a Microsoft MVP?",
        required: true,
      },
      {
        // id: generateQuestionId("MVP ID"),
        type: "text",
        label: "MVP ID",
        placeholder: "Enter your MVP ID",
        required: false,
      },
      {
        // id: generateQuestionId("MVP Profile Link"),
        type: "text",
        label: "MVP Profile Link",
        placeholder: "Enter your MVP profile link",
        required: false,
      },
      {
        // id: generateQuestionId("MVP Category"),
        type: "text",
        label: "MVP Category",
        placeholder: "Enter your MVP category",
        required: false,
      },
      {
        // id: generateQuestionId("Are you running any meetup group?"),
        type: "checkbox",
        label: "Are you running any meetup group?",
        required: true,
      },
      {
        // id: generateQuestionId("Meetup/Event Name"),
        type: "text",
        label: "Meetup/Event Name",
        placeholder: "Enter the meetup/event name",
        required: true,
      },
      {
        // id: generateQuestionId("Event Details"),
        type: "textarea",
        label: "Event Details",
        placeholder: "Enter the event details",
        required: true,
      },
      {
        // id: generateQuestionId("Meetup page details"),
        type: "text",
        label: "Meetup page details",
        placeholder: "Enter the meetup page details",
        required: true,
      },
      {
        // id: generateQuestionId("LinkedIn ID"),
        type: "text",
        label: "LinkedIn ID",
        placeholder: "Enter your LinkedIn profile URL",
        required: true,
      },
      {
        // id: generateQuestionId("GitHub ID"),
        type: "text",
        label: "GitHub ID",
        placeholder: "Enter your GitHub profile URL",
        required: true,
      },
      {
        // id: generateQuestionId("Any other social Media ID"),
        type: "text",
        label: "Any other social Media ID",
        placeholder: "Enter any other social media profile URL",
        required: false,
      },
    ].map(q => {
      return { ...q, id: generateQuestionId(q.label) }; // Use new generateQuestionId
    });
    
    return {
      attendee: defaultAttendeeQuestions,
      volunteer: defaultVolunteerQuestions,
      speaker: defaultSpeakerQuestions,
    }
  }, [])
  // Function to force refresh the form status
  const refreshFormStatus = async () => {
    if (!eventId || isApiCallInProgress.current) return

    try {
      setIsRefreshing(true)
      isApiCallInProgress.current = true

      // Add a timestamp and forceRefresh parameter to bypass cache
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/events/${eventId}/forms/status?forceRefresh=true&t=${timestamp}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch form status: ${response.status}`)
      }

      const data = await response.json()

      console.log("Refreshed form status:", data)

      // Update form status state
      setFormStatus({
        attendee: data.attendeeForm?.status || "draft",
        volunteer: data.volunteerForm?.status || "draft",
        speaker: data.speakerForm?.status || "draft",
      })

      // Update publish status based on form status
      setPublishStatus({
        attendee: data.attendeeForm?.status === "published",
        volunteer: data.volunteerForm?.status === "published",
        speaker: data.speakerForm?.status === "published",
      })

      // Set published URLs if forms are published
      if (data.eventSlug) {
        const baseUrl = window.location.origin
        if (data.attendeeForm?.status === "published") {
          setPublishedUrls((prev) => ({
            ...prev,
            attendee: `${baseUrl}/events/${data.eventSlug}/register`,
          }))
        }
        if (data.volunteerForm?.status === "published") {
          setPublishedUrls((prev) => ({
            ...prev,
            volunteer: `${baseUrl}/events/${data.eventSlug}/volunteer`,
          }))
        }
        if (data.speakerForm?.status === "published") {
          setPublishedUrls((prev) => ({
            ...prev,
            speaker: `${baseUrl}/events/${data.eventSlug}/speaker`,
          }))
        }
      }

      // Optionally, update the parent component as well
      if (updateFormStatus) {
        updateFormStatus("attendee", data.attendeeForm?.status || "draft")
        updateFormStatus("volunteer", data.volunteerForm?.status || "draft")
        updateFormStatus("speaker", data.speakerForm?.status || "draft")
      }

      toast({
        title: "Form status refreshed",
        description: "The form status has been refreshed from the database.",
      })

      // Update last fetch time
      lastFetchTime.current = Date.now()
    } catch (error) {
      console.error("Error refreshing form status:", error)
      toast({
        title: "Error refreshing form status",
        description: error.message || "Failed to refresh form status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
      isApiCallInProgress.current = false
    }
  }

  // Memoize the fetchFormStatus function to maintain referential stability
  const fetchFormStatus = useCallback(async () => {
    if (!eventId || isApiCallInProgress.current) return

    // Prevent fetching too frequently (at least 2 seconds between fetches)
    const now = Date.now()
    if (now - lastFetchTime.current < 2000) {
      return
    }

    try {
      isApiCallInProgress.current = true

      // Add a timestamp to bypass cache
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/events/${eventId}/forms/status?t=${timestamp}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch form status: ${response.status}`)
      }

      const data = await response.json()

      console.log("Initial form status:", data)

      // Update form status state
      setFormStatus({
        attendee: data.attendeeForm?.status || "draft",
        volunteer: data.volunteerForm?.status || "draft",
        speaker: data.speakerForm?.status || "draft",
      })

      // Update publish status based on form status
      setPublishStatus({
        attendee: data.attendeeForm?.status === "published",
        volunteer: data.volunteerForm?.status === "published",
        speaker: data.speakerForm?.status === "published",
      })

      // Set published URLs if forms are published
      if (data.eventSlug) {
        const baseUrl = window.location.origin
        if (data.attendeeForm?.status === "published") {
          setPublishedUrls((prev) => ({
            ...prev,
            attendee: `${baseUrl}/events/${data.eventSlug}/register`,
          }))
        }
        if (data.volunteerForm?.status === "published") {
          setPublishedUrls((prev) => ({
            ...prev,
            volunteer: `${baseUrl}/events/${data.eventSlug}/volunteer`,
          }))
        }
        if (data.speakerForm?.status === "published") {
          setPublishedUrls((prev) => ({
            ...prev,
            speaker: `${baseUrl}/events/${data.eventSlug}/speaker`,
          }))
        }
      }

      // Optionally, update the parent component as well
      if (updateFormStatus) {
        updateFormStatus("attendee", data.attendeeForm?.status || "draft")
        updateFormStatus("volunteer", data.volunteerForm?.status || "draft")
        updateFormStatus("speaker", data.speakerForm?.status || "draft")
      }

      formStatusFetched.current = true
      lastFetchTime.current = now
    } catch (error) {
      console.error("Error fetching form status:", error)
      toast({
        title: "Error fetching form status",
        description: error.message || "Failed to retrieve form status. Please try again.",
        variant: "destructive",
      })
    } finally {
      isApiCallInProgress.current = false
    }
  }, [eventId, updateFormStatus, toast])

  // Initialize with default questions or existing data
  useEffect(() => {
    try {
      // Get default questions
      const defaultQuestions = generateDefaultQuestions()

      // Safely check if data exists and has the expected properties
      const safeData = {
        attendee: Array.isArray(data?.attendee) ? data.attendee : [],
        volunteer: Array.isArray(data?.volunteer) ? data.volunteer : [],
        speaker: Array.isArray(data?.speaker) ? data.speaker : [],
      }

      // Use data if it exists, otherwise use defaults
      const attendeeData = safeData.attendee.length > 0 ? safeData.attendee : defaultQuestions.attendee
      const volunteerData = safeData.volunteer.length > 0 ? safeData.volunteer : defaultQuestions.volunteer
      const speakerData = safeData.speaker.length > 0 ? safeData.speaker : defaultQuestions.speaker

      // Set state with the appropriate data
      setAttendeeQuestions(attendeeData)
      setVolunteerQuestions(volunteerData)
      setSpeakerQuestions(speakerData)

      // IMPORTANT: Only update parent component on initial load or when data changes
      if (
        JSON.stringify(data) !==
        JSON.stringify({
          attendee: attendeeData,
          volunteer: volunteerData,
          speaker: speakerData,
        })
      ) {
        updateData({
          attendee: attendeeData,
          volunteer: volunteerData,
          speaker: speakerData,
        })
      }

      // Fetch form status if eventId exists and hasn't been fetched yet
      if (eventId && !formStatusFetched.current) {
        fetchFormStatus()
      }
    } catch (error) {
      console.error("Error initializing form data:", error)
      // Set default questions if there's an error
      const defaultQuestions = generateDefaultQuestions()
      setAttendeeQuestions(defaultQuestions.attendee)
      setVolunteerQuestions(defaultQuestions.volunteer)
      setSpeakerQuestions(defaultQuestions.speaker)

      // Update parent with defaults - only if needed
      if (!data || Object.keys(data).length === 0) {
        updateData(defaultQuestions)
      }
    }
  }, [data, updateData, eventId, fetchFormStatus, generateDefaultQuestions])

  // Handle initial form status from props - only run once
  useEffect(() => {
    if (initialFormStatus && !formStatusFetched.current) {
      setFormStatus(initialFormStatus)
      setPublishStatus({
        attendee: initialFormStatus.attendee === "published",
        volunteer: initialFormStatus.volunteer === "published",
        speaker: initialFormStatus.speaker === "published",
      })
    }
  }, [initialFormStatus])

  // Update parent component when questions change
  const updateQuestions = (type, questions) => {
    if (!Array.isArray(questions)) {
      console.error(`Invalid questions format for ${type}:`, questions)
      return
    }

    if (type === "attendee") {
      setAttendeeQuestions(questions)
    } else if (type === "volunteer") {
      setVolunteerQuestions(questions)
    } else if (type === "speaker") {
      setSpeakerQuestions(questions)
    }

    updateData({
      attendee: type === "attendee" ? questions : attendeeQuestions,
      volunteer: type === "volunteer" ? questions : volunteerQuestions,
      speaker: type === "speaker" ? questions : speakerQuestions,
    })
  }

  const togglePublishStatus = async (formType) => {
    // If an API call is already in progress, don't allow another toggle
    if (isPublishing[formType] || isApiCallInProgress.current) {
      return
    }

    const newStatus = !publishStatus[formType]

    // Update local state immediately for better UX
    setPublishStatus((prev) => ({
      ...prev,
      [formType]: newStatus,
    }))

    // Update parent component if needed
    if (updateFormStatus) {
      updateFormStatus(formType, newStatus ? "published" : "draft")
    }

    // If we have an eventId, update the database
    if (eventId) {
      try {
        // Set publishing state
        setIsPublishing((prev) => ({
          ...prev,
          [formType]: true,
        }))

        await publishForm(formType, newStatus)

        // No need to refresh form status here - the publishForm function already updates the state
      } catch (error) {
        // If there's an error, revert the local state
        setPublishStatus((prev) => ({
          ...prev,
          [formType]: !newStatus,
        }))

        // Update parent component if needed
        if (updateFormStatus) {
          updateFormStatus(formType, !newStatus ? "published" : "draft")
        }

        console.error(`Error toggling form status:`, error)
        toast({
          title: `Error updating form status`,
          description: error.message || `An error occurred while updating the form status.`,
          variant: "destructive",
        })
      } finally {
        setIsPublishing((prev) => ({
          ...prev,
          [formType]: false,
        }))
      }
    } else {
      // Just show a toast for feedback
      toast({
        title: newStatus ? "Form marked for publishing" : "Form set to draft",
        description: newStatus
          ? `The ${formType} form will be published when you save the event.`
          : `The ${formType} form will be saved as a draft.`,
      })
    }
  }

  // Publish a form
  const publishForm = async (formType, shouldPublish = true) => {
    if (isApiCallInProgress.current) return

    try {
      isApiCallInProgress.current = true

      // Determine which questions to send based on form type
      let questionsToSend = []

      const currentQuestions = formType === "attendee" ? attendeeQuestions : formType === "volunteer" ? volunteerQuestions : speakerQuestions;

      // Regenerate IDs for all questions before publishing to ensure they reflect the latest labels
      questionsToSend = currentQuestions.map(q => ({
        ...q, id: generateQuestionId(q.label) // Regenerate ID with new timestamp
      }));

      // Make sure we have at least the default questions
      if (!questionsToSend || questionsToSend.length === 0) {
        const defaultQuestions = generateDefaultQuestions()
        questionsToSend = defaultQuestions[formType]
      }

      // If we don't have an eventId, just update the local state
      if (!eventId) {
        setPublishStatus((prev) => ({
          ...prev,
          [formType]: shouldPublish,
        }))

        // Update the form status in the parent component if needed
        if (updateFormStatus) {
          updateFormStatus(formType, shouldPublish ? "published" : "draft")
        }

        // Set a placeholder URL for new events
        if (shouldPublish) {
          setPublishedUrls((prev) => ({
            ...prev,
            [formType]: "URL will be available after saving the event",
          }))
        }

        toast({
          title: shouldPublish ? "Form marked for publishing" : "Form set to draft",
          description: shouldPublish
            ? `The ${formType} form will be published when you save the event.`
            : `The ${formType} form will be saved as a draft.`,
        })
        return
      }

      console.log(`Publishing ${formType} form with status: ${shouldPublish ? "published" : "draft"}`)

      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime()

      // If we have an eventId, send the request to the server
      const response = await fetch(`/api/events/${eventId}/forms/${formType}/publish?t=${timestamp}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        body: JSON.stringify({
          status: shouldPublish ? "published" : "draft",
          questions: questionsToSend,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Server response:", errorData)
        throw new Error(errorData.error || `Failed to ${shouldPublish ? "publish" : "update"} form`)
      }

      const responseData = await response.json()
      console.log("Server response:", responseData)

      // Set the published URL if publishing
      if (shouldPublish) {
        const baseUrl = window.location.origin
        const formPath = formType === "attendee" ? "register" : formType
        // Use the slug from the response if available
        const eventSlug = responseData.eventSlug || eventId
        const url = `${baseUrl}/events/${eventSlug}/${formPath}`

        setPublishedUrls((prev) => ({
          ...prev,
          [formType]: url,
        }))
      } else {
        // Clear the URL if setting to draft
        setPublishedUrls((prev) => ({
          ...prev,
          [formType]: "",
        }))
      }

      // Update the form status in the local state
      setFormStatus((prev) => ({
        ...prev,
        [formType]: shouldPublish ? "published" : "draft",
      }))

      // Update the publish status in the local state
      setPublishStatus((prev) => ({
        ...prev,
        [formType]: shouldPublish,
      }))

      // Update the parent component if needed
      if (updateFormStatus) {
        updateFormStatus(formType, shouldPublish ? "published" : "draft")
      }

      toast({
        title: shouldPublish ? "Form published successfully" : "Form set to draft",
        description: shouldPublish
          ? `The ${formType} form has been published and is now available to the public.`
          : `The ${formType} form has been set to draft and is no longer publicly accessible.`,
        variant: "default",
      })

      // Update last fetch time
      lastFetchTime.current = Date.now()
    } catch (error) {
      console.error(`Error ${shouldPublish ? "publishing" : "updating"} form:`, error)
      toast({
        title: `Error ${shouldPublish ? "publishing" : "updating"} form`,
        description: error.message || `An error occurred while ${shouldPublish ? "publishing" : "updating"} the form.`,
        variant: "destructive",
      })

      throw error // Re-throw to allow the caller to handle it
    } finally {
      isApiCallInProgress.current = false
    }
  }

  const addQuestion = (type) => {
    const newQuestion = {
      type: "text",
      label: "",
      placeholder: "",
      required: false,
      options: [],
    }

    newQuestion.id = generateQuestionId(newQuestion.label); // Generate initial ID
    if (type === "attendee") {
      updateQuestions("attendee", [...attendeeQuestions, newQuestion])
    } else if (type === "volunteer") {
      updateQuestions("volunteer", [...volunteerQuestions, newQuestion])
    } else if (type === "speaker") {
      updateQuestions("speaker", [...speakerQuestions, newQuestion])
    }
  }

  const removeQuestion = (type, id) => {
    if (type === "attendee") {
      updateQuestions(
        "attendee",
        attendeeQuestions.filter((q) => q.id !== id),
      )
    } else if (type === "volunteer") {
      updateQuestions(
        "volunteer",
        volunteerQuestions.filter((q) => q.id !== id),
      )
    } else if (type === "speaker") {
      updateQuestions(
        "speaker",
        speakerQuestions.filter((q) => q.id !== id),
      )
    }
  }

  // This function updates the question's properties (like label, type) WITHOUT changing its ID.
  // The ID is only changed on blur or before publishing.
  const updateQuestion = (type, questionIdToUpdate, field, value) => {
    if (type === "attendee") {
      const updatedQuestions = attendeeQuestions.map((q) =>
        q.id === questionIdToUpdate ? { ...q, [field]: value } : q // Only update the field, not the ID here
      );
      updateQuestions("attendee", updatedQuestions)
    } else if (type === "volunteer") {
      const updatedQuestions = volunteerQuestions.map((q) =>
        q.id === questionIdToUpdate ? { ...q, [field]: value } : q
      );
      updateQuestions("volunteer", updatedQuestions)
    } else if (type === "speaker") {
      const updatedQuestions = speakerQuestions.map((q) =>
        q.id === questionIdToUpdate ? { ...q, [field]: value } : q
      );
      updateQuestions("speaker", updatedQuestions)
    }
  }

  // New handler for when the label input loses focus
  const handleLabelBlur = (type, questionIdToUpdate) => {
    let questionsList = [];
    if (type === "attendee") questionsList = attendeeQuestions;
    else if (type === "volunteer") questionsList = volunteerQuestions;
    else if (type === "speaker") questionsList = speakerQuestions;

    const updatedQuestions = questionsList.map((q) => {
      if (q.id === questionIdToUpdate) {
        // Regenerate the ID using the current label and stored creation timestamp
        return { ...q, id: generateQuestionId(q.label) }; // Regenerate ID with new timestamp
      }
      return q;
    });

    if (type === "attendee") {
      updateQuestions("attendee", updatedQuestions);
    } else if (type === "volunteer") {
      updateQuestions("volunteer", updatedQuestions);
    } else if (type === "speaker") {
      updateQuestions("speaker", updatedQuestions);
    }
  };

  const addOption = (type, questionId) => {
    const newOption = {
      id: `option_${Date.now()}`,
      value: "",
    }

    if (type === "attendee") {
      const updatedQuestions = attendeeQuestions.map((q) => {
        if (q.id === questionId) {
          return { ...q, options: [...(q.options || []), newOption] }
        }
        return q
      })
      updateQuestions("attendee", updatedQuestions)
    } else if (type === "volunteer") {
      const updatedQuestions = volunteerQuestions.map((q) => {
        if (q.id === questionId) {
          return { ...q, options: [...(q.options || []), newOption] }
        }
        return q
      })
      updateQuestions("volunteer", updatedQuestions)
    } else if (type === "speaker") {
      const updatedQuestions = speakerQuestions.map((q) => {
        if (q.id === questionId) {
          return { ...q, options: [...(q.options || []), newOption] }
        }
        return q
      })
      updateQuestions("speaker", updatedQuestions)
    }
  }

  const removeOption = (type, questionId, optionId) => {
    if (type === "attendee") {
      const updatedQuestions = attendeeQuestions.map((q) => {
        if (q.id === questionId && Array.isArray(q.options)) {
          return { ...q, options: q.options.filter((opt) => opt.id !== optionId) }
        }
        return q
      })
      updateQuestions("attendee", updatedQuestions)
    } else if (type === "volunteer") {
      const updatedQuestions = volunteerQuestions.map((q) => {
        if (q.id === questionId && Array.isArray(q.options)) {
          return { ...q, options: q.options.filter((opt) => opt.id !== optionId) }
        }
        return q
      })
      updateQuestions("volunteer", updatedQuestions)
    } else if (type === "speaker") {
      const updatedQuestions = speakerQuestions.map((q) => {
        if (q.id === questionId && Array.isArray(q.options)) {
          return { ...q, options: q.options.filter((opt) => opt.id !== optionId) }
        }
        return q
      })
      updateQuestions("speaker", updatedQuestions)
    }
  }

  const updateOption = (type, questionId, optionId, value) => {
    if (type === "attendee") {
      const updatedQuestions = attendeeQuestions.map((q) => {
        if (q.id === questionId && Array.isArray(q.options)) {
          return {
            ...q,
            options: q.options.map((opt) => (opt.id === optionId ? { ...opt, value } : opt)),
          }
        }
        return q
      })
      updateQuestions("attendee", updatedQuestions)
    } else if (type === "volunteer") {
      const updatedQuestions = volunteerQuestions.map((q) => {
        if (q.id === questionId && Array.isArray(q.options)) {
          return {
            ...q,
            options: q.options.map((opt) => (opt.id === optionId ? { ...opt, value } : opt)),
          }
        }
        return q
      })
      updateQuestions("volunteer", updatedQuestions)
    } else if (type === "speaker") {
      const updatedQuestions = speakerQuestions.map((q) => {
        if (q.id === questionId && Array.isArray(q.options)) {
          return {
            ...q,
            options: q.options.map((opt) => (opt.id === optionId ? { ...opt, value } : opt)),
          }
        }
        return q
      })
      updateQuestions("speaker", updatedQuestions)
    }
  }

  const renderQuestionFields = (question, type, index) => {
    if (!question) return null

    return (
      <div className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`${question.id}-label`}>Question Label</Label>
            <Input
              id={`${question.id}-label`}
              value={question.label || ""}
              onChange={(e) => updateQuestion(type, question.id, "label", e.target.value)}
              onBlur={() => handleLabelBlur(type, question.id)} // Regenerate ID on blur
              placeholder="Enter question label"
              required
            />
          </div>
          <div>
            <Label htmlFor={`${question.id}-type`}>Question Type</Label>
            <Select
              value={question.type || "text"}
              onValueChange={(value) => updateQuestion(type, question.id, "type", value)}
            >
              <SelectTrigger id={`${question.id}-type`}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="textarea">Text Area</SelectItem>
                <SelectItem value="select">Dropdown</SelectItem>
                <SelectItem value="radio">Radio Buttons</SelectItem>
                <SelectItem value="checkbox">Checkboxes</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor={`${question.id}-placeholder`}>Placeholder Text</Label>
          <Input
            id={`${question.id}-placeholder`}
            value={question.placeholder || ""}
            onChange={(e) => updateQuestion(type, question.id, "placeholder", e.target.value)}
            placeholder="Enter placeholder text"
          />
        </div>

        {["select", "radio", "checkbox"].includes(question.type) && (
          <div className="space-y-2">
            <Label>Options</Label>
            <div className="space-y-1">
              {Array.isArray(question.options) &&
                question.options.map((option, optIndex) => (
                  <div key={option.id || `option-${optIndex}`} className="flex items-center space-x-2">
                    <Input
                      value={option.value || ""}
                      onChange={(e) => updateOption(type, question.id, option.id, e.target.value)}
                      placeholder={`Option ${optIndex + 1}`}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(type, question.id, option.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addOption(type, question.id)}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Switch
            id={`${question.id}-required`}
            checked={question.required || false}
            onCheckedChange={(checked) => updateQuestion(type, question.id, "required", checked)}
          />
          <Label htmlFor={`${question.id}-required`}>Required</Label>
        </div>
      </div>
    )
  }

  const renderFormCard = (type, title, description, questions, setQuestions) => {
    // Ensure questions is always an array
    const safeQuestions = Array.isArray(questions) ? questions : []

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id={`${type}-publish-toggle`}
                checked={publishStatus[type]}
                onCheckedChange={() => togglePublishStatus(type)}
                disabled={isPublishing[type] || isApiCallInProgress.current}
              />
              <Label htmlFor={`${type}-publish-toggle`} className="font-medium">
                {isPublishing[type] ? "Updating..." : publishStatus[type] ? "Published" : "Draft"}
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {/* Display the published URL if available */}
          {publishStatus[type] && (
            <div className="mb-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium mb-1">Public URL:</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-background p-1 rounded flex-1 overflow-x-auto">
                  {publishedUrls[type] ||
                    (eventId
                      ? `${window.location.origin}/events/${eventId}/${type === "attendee" ? "register" : type}`
                      : "URL will be available after saving the event")}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const url =
                      publishedUrls[type] ||
                      (eventId
                        ? `${window.location.origin}/events/${eventId}/${type === "attendee" ? "register" : type}`
                        : null)

                    if (url) {
                      navigator.clipboard.writeText(url)
                      toast({
                        title: "URL Copied",
                        description: "The public URL has been copied to your clipboard.",
                      })
                    } else {
                      toast({
                        title: "URL Not Available",
                        description: "Save the event first to generate a public URL.",
                        variant: "destructive",
                      })
                    }
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-copy"
                  >
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {safeQuestions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No questions added yet. Add your first question below.
              </div>
            ) : (
              safeQuestions.map((question, index) => (
                <div key={question.id || `question-${index}`} className="border rounded-lg p-4 relative">
                  <div className="absolute right-2 top-2 flex space-x-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeQuestion(type, question.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="cursor-move">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="mb-2 font-medium">Question {index + 1}</div>
                  {renderQuestionFields(question, type, index)}
                </div>
              ))
            )}
          </div>

          <Button type="button" onClick={() => addQuestion(type)} className="mt-4 w-full" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Custom Questions</h2>
          <p className="text-muted-foreground">
            Add custom questions to collect additional information from attendees, volunteers, and speakers.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={refreshFormStatus}
          disabled={isRefreshing || isApiCallInProgress.current}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh Form Status"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attendee">
            Attendee Questions
            {publishStatus.attendee && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Published
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="volunteer">
            Volunteer Questions
            {publishStatus.volunteer && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Published
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="speaker">
            Speaker Questions
            {publishStatus.speaker && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Published
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendee" className="space-y-4 mt-4">
          {renderFormCard(
            "attendee",
            "Attendee Registration Questions",
            "These questions will be shown to attendees when they register for your event.",
            attendeeQuestions,
            setAttendeeQuestions,
          )}
        </TabsContent>

        <TabsContent value="volunteer" className="space-y-4 mt-4">
          {renderFormCard(
            "volunteer",
            "Volunteer Application Questions",
            "These questions will be shown to volunteers when they apply to help at your event.",
            volunteerQuestions,
            setVolunteerQuestions,
          )}
        </TabsContent>

        <TabsContent value="speaker" className="space-y-4 mt-4">
          {renderFormCard(
            "speaker",
            "Speaker Application Questions",
            "These questions will be shown to speakers when they apply to speak at your event.",
            speakerQuestions,
            setSpeakerQuestions,
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
