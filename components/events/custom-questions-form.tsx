"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, Plus, GripVertical, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
// Add this import at the top of the file
import { v4 as uuidv4 } from "uuid"

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

  // Generate default questions for each form type
  const generateDefaultQuestions = useCallback(() => {
    // Default attendee questions
    const defaultAttendeeQuestions = [
      {
        id: `question_name_${Date.now()}`,
        type: "text",
        label: "Full Name",
        placeholder: "Enter your full name",
        required: true,
      },
      {
        id: `question_email_${Date.now() + 1}`,
        type: "email",
        label: "Email Address",
        placeholder: "Enter your email address",
        required: true,
      },
      {
        id: `question_phone_${Date.now() + 2}`,
        type: "phone",
        label: "Phone Number",
        placeholder: "Enter your phone number",
        required: true,
      },
    ]

    // Default volunteer questions
    const defaultVolunteerQuestions = [
      {
        id: `question_name_${Date.now() + 10}`,
        type: "text",
        label: "Full Name",
        placeholder: "Enter your full name",
        required: true,
      },
      {
        id: `question_email_${Date.now() + 11}`,
        type: "email",
        label: "Email Address",
        placeholder: "Enter your email address",
        required: true,
      },
      {
        id: `question_phone_${Date.now() + 12}`,
        type: "phone",
        label: "Phone Number",
        placeholder: "Enter your phone number",
        required: true,
      },
      {
        id: `question_role_${Date.now() + 13}`,
        type: "select",
        label: "Preferred Role",
        placeholder: "Select your preferred role",
        required: true,
        options: [
          { id: "role_1", value: "Event Setup" },
          { id: "role_2", value: "Registration Desk" },
          { id: "role_3", value: "Technical Support" },
          { id: "role_4", value: "Food Service" },
          { id: "role_5", value: "Cleanup Crew" },
        ],
      },
      {
        id: `question_availability_${Date.now() + 14}`,
        type: "date",
        label: "Availability",
        placeholder: "Select dates you're available",
        required: true,
      },
      {
        id: `question_experience_${Date.now() + 15}`,
        type: "textarea",
        label: "Previous Experience",
        placeholder: "Describe your previous volunteer experience",
        required: true,
      },
      {
        id: `question_terms_${Date.now() + 16}`,
        type: "checkbox",
        label: "I agree to the volunteer terms and conditions",
        required: true,
      },
    ]

    // Default speaker questions
    const defaultSpeakerQuestions = [
      {
        id: `question_name_${Date.now() + 20}`,
        type: "text",
        label: "Full Name",
        placeholder: "Enter your full name",
        required: true,
      },
      {
        id: `question_email_${Date.now() + 21}`,
        type: "email",
        label: "Email Address",
        placeholder: "Enter your email address",
        required: true,
      },
      {
        id: `question_job_${Date.now() + 22}`,
        type: "text",
        label: "Job Title",
        placeholder: "Enter your job title",
        required: true,
      },
      {
        id: `question_company_${Date.now() + 23}`,
        type: "text",
        label: "Company/Organization",
        placeholder: "Enter your company or organization",
        required: true,
      },
      {
        id: `question_bio_${Date.now() + 24}`,
        type: "textarea",
        label: "Bio",
        placeholder: "Enter a short biography",
        required: true,
      },
      {
        id: `question_talk_title_${Date.now() + 25}`,
        type: "text",
        label: "Talk Title",
        placeholder: "Enter the title of your talk",
        required: true,
      },
      {
        id: `question_talk_abstract_${Date.now() + 26}`,
        type: "textarea",
        label: "Talk Abstract",
        placeholder: "Provide a brief abstract of your talk",
        required: true,
      },
      {
        id: `question_talk_duration_${Date.now() + 27}`,
        type: "select",
        label: "Talk Duration",
        placeholder: "Select the duration of your talk",
        required: true,
        options: [
          { id: "duration_1", value: "15 minutes" },
          { id: "duration_2", value: "30 minutes" },
          { id: "duration_3", value: "45 minutes" },
          { id: "duration_4", value: "60 minutes" },
        ],
      },
      {
        id: `question_talk_level_${Date.now() + 28}`,
        type: "select",
        label: "Talk Level",
        placeholder: "Select the level of your talk",
        required: true,
        options: [
          { id: "level_1", value: "Beginner" },
          { id: "level_2", value: "Intermediate" },
          { id: "level_3", value: "Advanced" },
        ],
      },
      {
        id: `question_topics_${Date.now() + 29}`,
        type: "select",
        label: "Topics",
        placeholder: "Select relevant topics",
        required: true,
        options: [
          { id: "topic_1", value: "Technology" },
          { id: "topic_2", value: "Business" },
          { id: "topic_3", value: "Design" },
          { id: "topic_4", value: "Marketing" },
          { id: "topic_5", value: "Personal Development" },
        ],
      },
      {
        id: `question_photo_${Date.now() + 30}`,
        type: "text",
        label: "Profile Photo URL",
        placeholder: "Enter URL to your profile photo",
        required: false,
      },
      {
        id: `question_speaking_exp_${Date.now() + 31}`,
        type: "textarea",
        label: "Previous Speaking Experience",
        placeholder: "Describe your previous speaking experience",
        required: true,
      },
      {
        id: `question_social_${Date.now() + 32}`,
        type: "text",
        label: "Social Media Profiles",
        placeholder: "Enter your social media profile links",
        required: false,
      },
    ]

    return {
      attendee: defaultAttendeeQuestions,
      volunteer: defaultVolunteerQuestions,
      speaker: defaultSpeakerQuestions,
    }
  }, [])

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
  }, [data, generateDefaultQuestions, updateData])

  const fetchFormStatus = useCallback(async () => {
    if (eventId) {
      try {
        const response = await fetch(`/api/events/${eventId}/forms/status`)
        if (response.ok) {
          const statusData = await response.json()

          // Update publish status based on form status from database
          setPublishStatus({
            attendee: statusData.attendeeForm?.status === "published",
            volunteer: statusData.volunteerForm?.status === "published",
            speaker: statusData.speakerForm?.status === "published",
          })

          // Update the local form status state
          setFormStatus({
            attendee: statusData.attendeeForm?.status || "draft",
            volunteer: statusData.volunteerForm?.status || "draft",
            speaker: statusData.speakerForm?.status || "draft",
          })

          // If the parent component has an updateFormStatus function, call it
          if (updateFormStatus) {
            updateFormStatus("attendee", statusData.attendeeForm?.status || "draft")
            updateFormStatus("volunteer", statusData.volunteerForm?.status || "draft")
            updateFormStatus("speaker", statusData.speakerForm?.status || "draft")
          }

          // Get the event slug
          const eventSlug = statusData.eventSlug || null

          // Set published URLs if forms are published
          if (statusData.attendeeForm?.status === "published") {
            setPublishedUrls((prev) => ({
              ...prev,
              attendee: eventSlug
                ? `${window.location.origin}/events/${eventSlug}/register`
                : `${window.location.origin}/events/${eventId}/register`,
            }))
          }

          if (statusData.volunteerForm?.status === "published") {
            setPublishedUrls((prev) => ({
              ...prev,
              volunteer: eventSlug
                ? `${window.location.origin}/events/${eventSlug}/volunteer`
                : `${window.location.origin}/events/${eventId}/volunteer`,
            }))
          }

          if (statusData.speakerForm?.status === "published") {
            setPublishedUrls((prev) => ({
              ...prev,
              speaker: eventSlug
                ? `${window.location.origin}/events/${eventSlug}/speaker`
                : `${window.location.origin}/events/${eventId}/speaker`,
            }))
          }
        }
      } catch (error) {
        console.error("Error fetching form status:", error)
      }
    }
  }, [eventId, updateFormStatus])

  // Fetch form publish status
  useEffect(() => {
    try {
      fetchFormStatus()
    } catch (error) {
      console.error("Error in useEffect:", error)
    }
  }, [eventId, fetchFormStatus])

  // Update parent component when questions change
  const updateQuestions = useCallback(
    (type, questions) => {
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
    },
    [attendeeQuestions, speakerQuestions, updateData, volunteerQuestions],
  )

  // Toggle form publish status
  const togglePublishStatus = useCallback(
    async (formType) => {
      const newStatus = !publishStatus[formType]

      // Update local state
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

          console.log(
            `${newStatus ? "Publishing" : "Setting to draft"} ${formType} form with questions:`,
            questionsToSend,
          )

          // If we have an eventId, send the request to the server
          const response = await fetch(`/api/events/${eventId}/forms/${formType}/publish`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: newStatus ? "published" : "draft",
              questions: questionsToSend,
            }),
          })

          if (!response.ok) {
            let error
            const errorData = await response.json()
            console.error("Server response:", errorData)
            error = new Error(errorData.error || `Failed to ${newStatus ? "publish" : "update"} form`)
            throw error
          }

          const responseData = await response.json()
          console.log("Server response:", responseData)

          // Set the published URL if publishing
          if (newStatus) {
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
            title: newStatus ? "Form published successfully" : "Form set to draft",
            description: newStatus
              ? `The ${formType} form has been published and is now available to the public.`
              : `The ${formType} form has been set to draft and is no longer publicly accessible.`,
            variant: "success",
          })
        } catch (error) {
          console.error(`Error ${newStatus ? "publishing" : "updating"} form:`, error)
          toast({
            title: `Error ${newStatus ? "publishing" : "updating"} form`,
            description: error.message || `An error occurred while ${newStatus ? "publishing" : "updating"} the form.`,
            variant: "destructive",
          })
        }
      }
    },
    [
      eventId,
      publishStatus,
      setPublishedUrls,
      toast,
      updateFormStatus,
      generateDefaultQuestions,
      attendeeQuestions,
      volunteerQuestions,
      speakerQuestions,
    ],
  )

  // Add a new question
  const addQuestion = useCallback(
    (type) => {
      const newQuestion = {
        id: `question_${uuidv4()}`,
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
    },
    [attendeeQuestions, speakerQuestions, updateQuestions, volunteerQuestions],
  )

  // Remove a question
  const removeQuestion = useCallback(
    (type, id) => {
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
    },
    [attendeeQuestions, speakerQuestions, updateQuestions, volunteerQuestions],
  )

  // Update a question
  const updateQuestion = useCallback(
    (type, id, field, value) => {
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
    },
    [attendeeQuestions, speakerQuestions, updateQuestions, volunteerQuestions],
  )

  // Add an option to a select/radio/checkbox question
  const addOption = useCallback(
    (type, questionId) => {
      const newOption = {
        id: `option_${uuidv4()}`,
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
    },
    [attendeeQuestions, speakerQuestions, updateQuestions, volunteerQuestions],
  )

  // Remove an option
  const removeOption = useCallback(
    (type, questionId, optionId) => {
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
    },
    [attendeeQuestions, speakerQuestions, updateQuestions, volunteerQuestions],
  )

  // Update an option
  const updateOption = useCallback(
    (type, questionId, optionId, value) => {
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
    },
    [attendeeQuestions, speakerQuestions, updateQuestions, volunteerQuestions],
  )

  const renderQuestionFields = useCallback(
    (question, type, index) => {
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
    },
    [updateQuestion, removeOption, addOption, updateOption],
  )

  const renderFormCard = useCallback(
    (type, title, description, questions) => {
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

            {/* Display draft notice if not published */}
            {!publishStatus[type] && (
              <div className="mb-4 p-3 bg-muted rounded-md flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  This form is currently in draft mode and not accessible to the public. Toggle the switch above to
                  publish it.
                </p>
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestion(type, question.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="cursor-move">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
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
    },
    [
      publishStatus,
      publishedUrls,
      eventId,
      toast,
      renderQuestionFields,
      togglePublishStatus,
      addQuestion,
      removeQuestion,
    ],
  )

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
          )}
        </TabsContent>

        <TabsContent value="volunteer" className="space-y-4 mt-4">
          {renderFormCard(
            "volunteer",
            "Volunteer Application Questions",
            "These questions will be shown to volunteers when they apply to help at your event.",
            volunteerQuestions,
          )}
        </TabsContent>

        <TabsContent value="speaker" className="space-y-4 mt-4">
          {renderFormCard(
            "speaker",
            "Speaker Application Questions",
            "These questions will be shown to speakers when they apply to speak at your event.",
            speakerQuestions,
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
