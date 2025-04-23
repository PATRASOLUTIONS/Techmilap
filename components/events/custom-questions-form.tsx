"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, Plus, GripVertical } from "lucide-react"
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
        id: `question_email_${Date.now() + 1}`,
        type: "email",
        label: "Email ID",
        placeholder: "Enter your email address",
        required: true,
      },
      {
        id: `question_corporateEmail_${Date.now() + 2}`,
        type: "email",
        label: "Corporate Email ID",
        placeholder: "Enter your corporate email address",
        required: true,
      },
      {
        id: `question_designation_${Date.now() + 3}`,
        type: "text",
        label: "Designation",
        placeholder: "Enter your designation",
        required: true,
      },
      {
        id: `question_linkedinId_${Date.now() + 4}`,
        type: "text",
        label: "LinkedIn ID",
        placeholder: "Enter your LinkedIn profile URL",
        required: true,
      },
      {
        id: `question_githubId_${Date.now() + 5}`,
        type: "text",
        label: "GitHub ID",
        placeholder: "Enter your GitHub profile URL",
        required: true,
      },
      {
        id: `question_otherSocialMediaId_${Date.now() + 6}`,
        type: "text",
        label: "Any other social Media ID",
        placeholder: "Enter any other social media profile URL",
        required: false,
      },
      {
        id: `question_mobileNumber_${Date.now() + 7}`,
        type: "phone",
        label: "Mobile number",
        placeholder: "Enter your mobile number",
        required: true,
      },
    ]

    const defaultVolunteerQuestions = [
      {
        id: `question_name_${Date.now() + 10}`,
        type: "text",
        label: "Name",
        placeholder: "Enter your name",
        required: true,
      },
      {
        id: `question_email_${Date.now() + 11}`,
        type: "email",
        label: "Email ID",
        placeholder: "Enter your email address",
        required: true,
      },
      {
        id: `question_corporateEmail_${Date.now() + 12}`,
        type: "email",
        label: "Corporate Email ID",
        placeholder: "Enter your corporate email address",
        required: true,
      },
      {
        id: `question_designation_${Date.now() + 13}`,
        type: "text",
        label: "Designation",
        placeholder: "Enter your designation",
        required: true,
      },
      {
        id: `question_eventOrganizer_${Date.now() + 14}`,
        type: "text",
        label: "Event Organizer",
        placeholder: "Enter the event organizer",
        required: true,
      },
      {
        id: `question_isMicrosoftMVP_${Date.now() + 15}`,
        type: "checkbox",
        label: "Are you a Microsoft MVP?",
        required: true,
      },
      {
        id: `question_mvpId_${Date.now() + 16}`,
        type: "text",
        label: "MVP ID",
        placeholder: "Enter your MVP ID",
        required: false,
      },
      {
        id: `question_mvpProfileLink_${Date.now() + 17}`,
        type: "text",
        label: "MVP Profile Link",
        placeholder: "Enter your MVP profile link",
        required: false,
      },
      {
        id: `question_mvpCategory_${Date.now() + 18}`,
        type: "text",
        label: "MVP Category",
        placeholder: "Enter your MVP category",
        required: false,
      },
      {
        id: `question_howManyEventsVolunteered_${Date.now() + 19}`,
        type: "select",
        label: "How many events have you supported as a volunteer?",
        placeholder: "Select the number of events",
        required: true,
        options: [
          { id: "events_1", value: "1-5" },
          { id: "events_2", value: "6-10" },
          { id: "events_3", value: "11+" },
        ],
      },
      {
        id: `question_meetupEventName_${Date.now() + 20}`,
        type: "text",
        label: "Meetup/Event Name",
        placeholder: "Enter the meetup/event name",
        required: true,
      },
      {
        id: `question_eventDetails_${Date.now() + 21}`,
        type: "textarea",
        label: "Event Details",
        placeholder: "Enter the event details",
        required: true,
      },
      {
        id: `question_meetupPageDetails_${Date.now() + 22}`,
        type: "text",
        label: "Meetup page details",
        placeholder: "Enter the meetup page details",
        required: true,
      },
      {
        id: `question_yourContribution_${Date.now() + 23}`,
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
        id: `question_organizerName_${Date.now() + 24}`,
        type: "text",
        label: "Organizer Name/ LinkedIn ID",
        placeholder: "Enter the organizer name/ LinkedIn ID",
        required: true,
      },
      {
        id: `question_linkedinId_${Date.now() + 25}`,
        type: "text",
        label: "LinkedIn ID",
        placeholder: "Enter your LinkedIn profile URL",
        required: true,
      },
      {
        id: `question_githubId_${Date.now() + 26}`,
        type: "text",
        label: "GitHub ID",
        placeholder: "Enter your GitHub profile URL",
        required: true,
      },
      {
        id: `question_otherSocialMediaId_${Date.now() + 27}`,
        type: "text",
        label: "Any other social Media ID",
        placeholder: "Enter any other social media profile URL",
        required: false,
      },
      {
        id: `question_mobileNumber_${Date.now() + 28}`,
        type: "phone",
        label: "Mobile number",
        placeholder: "Enter your mobile number",
        required: true,
      },
    ]

    const defaultSpeakerQuestions = [
      {
        id: `question_name_${Date.now() + 30}`,
        type: "text",
        label: "Name",
        placeholder: "Enter your name",
        required: true,
      },
      {
        id: `question_email_${Date.now() + 31}`,
        type: "email",
        label: "Email ID",
        placeholder: "Enter your email address",
        required: true,
      },
      {
        id: `question_corporateEmail_${Date.now() + 32}`,
        type: "email",
        label: "Corporate Email ID",
        placeholder: "Enter your corporate email address",
        required: true,
      },
      {
        id: `question_designation_${Date.now() + 33}`,
        type: "text",
        label: "Designation",
        placeholder: "Enter your designation",
        required: true,
      },
      {
        id: `question_eventOrganizer_${Date.now() + 34}`,
        type: "text",
        label: "Event Organizer",
        placeholder: "Enter the event organizer",
        required: true,
      },
      {
        id: `question_isMicrosoftMVP_${Date.now() + 35}`,
        type: "checkbox",
        label: "Are you a Microsoft MVP?",
        required: true,
      },
      {
        id: `question_mvpId_${Date.now() + 36}`,
        type: "text",
        label: "MVP ID",
        placeholder: "Enter your MVP ID",
        required: false,
      },
      {
        id: `question_mvpProfileLink_${Date.now() + 37}`,
        type: "text",
        label: "MVP Profile Link",
        placeholder: "Enter your MVP profile link",
        required: false,
      },
      {
        id: `question_mvpCategory_${Date.now() + 38}`,
        type: "text",
        label: "MVP Category",
        placeholder: "Enter your MVP category",
        required: false,
      },
      {
        id: `question_areYouRunningMeetupGroup_${Date.now() + 39}`,
        type: "checkbox",
        label: "Are you running any meetup group?",
        required: true,
      },
      {
        id: `question_meetupEventName_${Date.now() + 40}`,
        type: "text",
        label: "Meetup/Event Name",
        placeholder: "Enter the meetup/event name",
        required: true,
      },
      {
        id: `question_eventDetails_${Date.now() + 41}`,
        type: "textarea",
        label: "Event Details",
        placeholder: "Enter the event details",
        required: true,
      },
      {
        id: `question_meetupPageDetails_${Date.now() + 42}`,
        type: "text",
        label: "Meetup page details",
        placeholder: "Enter the meetup page details",
        required: true,
      },
      {
        id: `question_linkedinId_${Date.now() + 43}`,
        type: "text",
        label: "LinkedIn ID",
        placeholder: "Enter your LinkedIn profile URL",
        required: true,
      },
      {
        id: `question_githubId_${Date.now() + 44}`,
        type: "text",
        label: "GitHub ID",
        placeholder: "Enter your GitHub profile URL",
        required: true,
      },
      {
        id: `question_otherSocialMediaId_${Date.now() + 45}`,
        type: "text",
        label: "Any other social Media ID",
        placeholder: "Enter any other social media profile URL",
        required: false,
      },
    ]

    return {
      attendee: defaultAttendeeQuestions,
      volunteer: defaultVolunteerQuestions,
      speaker: defaultSpeakerQuestions,
    }
  }, [])

  const fetchFormStatus = useCallback(async () => {
    if (!eventId) return

    try {
      const response = await fetch(`/api/events/${eventId}/forms/status`)
      if (!response.ok) {
        throw new Error(`Failed to fetch form status: ${response.status}`)
      }
      const data = await response.json()

      setFormStatus(data)
      setPublishStatus({
        attendee: data.attendeeForm?.status === "published",
        volunteer: data.volunteerForm?.status === "published",
        speaker: data.speakerForm?.status === "published",
      })

      // Optionally, update the parent component as well
      if (updateFormStatus) {
        updateFormStatus("attendee", data.attendeeForm?.status || "draft")
        updateFormStatus("volunteer", data.volunteerForm?.status || "draft")
        updateFormStatus("speaker", data.speakerForm?.status || "draft")
      }
    } catch (error) {
      console.error("Error fetching form status:", error)
      toast({
        title: "Error fetching form status",
        description: error.message || "Failed to retrieve form status. Please try again.",
        variant: "destructive",
      })
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

      // Update parent component with processed data
      updateData({
        attendee: attendeeData,
        volunteer: volunteerData,
        speaker: speakerData,
      })

      // Fetch form status if eventId exists
      if (eventId) {
        fetchFormStatus()
      }
    } catch (error) {
      console.error("Error initializing form data:", error)
      // Set default questions if there's an error
      const defaultQuestions = generateDefaultQuestions()
      setAttendeeQuestions(defaultQuestions.attendee)
      setVolunteerQuestions(defaultQuestions.volunteer)
      setSpeakerQuestions(defaultQuestions.speaker)

      // Update parent with defaults
      updateData(defaultQuestions)
    }
  }, [eventId, fetchFormStatus, generateDefaultQuestions])

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

  // Toggle form publish status
  const togglePublishStatus = (formType) => {
    const newStatus = !publishStatus[formType]

    // If we have an eventId, update the database
    if (eventId) {
      // Don't update state here, let publishForm handle it
      publishForm(formType, newStatus)
    } else {
      // Update local state only if we don't have an eventId
      setPublishStatus((prev) => ({
        ...prev,
        [formType]: newStatus,
      }))

      // Update parent component if needed
      if (updateFormStatus) {
        updateFormStatus(formType, newStatus ? "published" : "draft")
      }

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
    try {
      // Determine which questions to send based on form type
      let questionsToSend = []

      if (formType === "attendee") {
        questionsToSend = attendeeQuestions
      } else if (formType === "volunteer") {
        questionsToSend = volunteerQuestions
      } else if (formType === "speaker") {
        questionsToSend = speakerQuestions
      }

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

      console.log(`${shouldPublish ? "Publishing" : "Setting to draft"} ${formType} form...`)

      // If we have an eventId, send the request to the server
      const response = await fetch(`/api/events/${eventId}/forms/${formType}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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

      toast({
        title: shouldPublish ? "Form published successfully" : "Form set to draft",
        description: shouldPublish
          ? `The ${formType} form has been published and is now available to the public.`
          : `The ${formType} form has been set to draft and is no longer publicly accessible.`,
        variant: "default",
      })
    } catch (error) {
      console.error(`Error ${shouldPublish ? "publishing" : "updating"} form:`, error)
      toast({
        title: `Error ${shouldPublish ? "publishing" : "updating"} form`,
        description: error.message || `An error occurred while ${shouldPublish ? "publishing" : "updating"} the form.`,
        variant: "destructive",
      })
    }
  }

  // Add a new question
  const addQuestion = (type) => {
    const newQuestion = {
      id: `question_${Date.now()}`,
      type: "text",
      label: "",
      placeholder: "",
      required: false,
      options: [],
    }

    if (type === "attendee") {
      updateQuestions("attendee", [...attendeeQuestions, newQuestion])
    } else if (type === "volunteer") {
      updateQuestions("volunteer", [...volunteerQuestions, newQuestion])
    } else if (type === "speaker") {
      updateQuestions("speaker", [...speakerQuestions, newQuestion])
    }
  }

  // Remove a question
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

  // Update a question
  const updateQuestion = (type, id, field, value) => {
    if (type === "attendee") {
      const updatedQuestions = attendeeQuestions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
      updateQuestions("attendee", updatedQuestions)
    } else if (type === "volunteer") {
      const updatedQuestions = volunteerQuestions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
      updateQuestions("volunteer", updatedQuestions)
    } else if (type === "speaker") {
      const updatedQuestions = speakerQuestions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
      updateQuestions("speaker", updatedQuestions)
    }
  }

  // Add an option to a select/radio/checkbox question
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

  // Remove an option
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

  // Update an option
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
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`${question.id}-label`}>Question Label</Label>
            <Input
              id={`${question.id}-label`}
              value={question.label || ""}
              onChange={(e) => updateQuestion(type, question.id, "label", e.target.value)}
              placeholder="Enter question label"
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
            <div className="space-y-2">
              {Array.isArray(question.options) &&
                question.options.map((option, optIndex) => (
                  <div key={option.id || `option-${optIndex}`} className="flex items-center space-x-2">
                    <Input
                      value={option.value || ""}
                      onChange={(e) => updateOption(type, question.id, option.id, e.target.value)}
                      placeholder={`Option ${optIndex + 1}`}
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
              />
              <Label htmlFor={`${type}-publish-toggle`} className="font-medium">
                {publishStatus[type] ? "Published" : "Draft"}
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
      <div>
        <h2 className="text-2xl font-bold">Custom Questions</h2>
        <p className="text-muted-foreground">
          Add custom questions to collect additional information from attendees, volunteers, and speakers.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attendee">Attendee Questions</TabsTrigger>
          <TabsTrigger value="volunteer">Volunteer Questions</TabsTrigger>
          <TabsTrigger value="speaker">Speaker Questions</TabsTrigger>
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
