"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Eye, CheckCircle, XCircle, Search, Filter, X, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ColumnDef } from "@tanstack/react-table"

// Add interface for filters
interface FilterState {
  [key: string]: string | boolean | null | number[] | Date
}

// Add the fieldMappings prop to the interface
interface RegistrationsTableProps {
  eventId: string
  title: string
  description: string
  filterStatus?: "pending" | "approved" | "rejected"
  formType?: string
  fieldMappings?: {
    [key: string]: string[]
  }
}

interface SubmissionsTableProps {
  eventId: string
  formType: "attendee" | "volunteer" | "speaker"
  title: string
  description: string
  filterStatus?: "pending" | "approved" | "rejected"
  fieldMappings?: {
    [key: string]: string[]
  }
}

// Add these predefined questions for each form type
const PREDEFINED_QUESTIONS = {
  attendee: [
    { id: "name", label: "Name", type: "text" },
    { id: "email", label: "Email ID", type: "text" },
    { id: "corporateEmail", label: "Corporate Email ID", type: "text" },
    { id: "designation", label: "Designation", type: "text" },
    { id: "linkedinId", label: "LinkedIn ID", type: "text" },
    { id: "githubId", label: "GitHub ID", type: "text" },
    { id: "otherSocialMediaId", label: "Any other social Media ID", type: "text" },
    { id: "mobileNumber", label: "Mobile number", type: "text" },
  ],
  volunteer: [
    { id: "name", label: "Name", type: "text" },
    { id: "email", label: "Email ID", type: "text" },
    { id: "corporateEmail", label: "Corporate Email ID", type: "text" },
    { id: "designation", label: "Designation", type: "text" },
    { id: "eventOrganizer", label: "Event Organizer", type: "text" },
    { id: "isMvp", label: "Are you a Microsoft MVP?", type: "checkbox" },
    { id: "mvpId", label: "MVP ID", type: "text" },
    { id: "mvpProfileLink", label: "MVP Profile Link", type: "text" },
    { id: "mvpCategory", label: "MVP Category", type: "text" },
    { id: "eventsSupported", label: "How many events have you supported as a volunteer?", type: "number" },
    { id: "meetupName", label: "Meetup/Event Name", type: "text" },
    { id: "eventDetails", label: "Event Details", type: "text" },
    { id: "meetupPageDetails", label: "Meetup page details", type: "text" },
    { id: "contribution", label: "Your Contribution", type: "text" },
    { id: "organizerInfo", label: "Organizer Name/ LinkedIn ID", type: "text" },
    { id: "linkedinId", label: "LinkedIn ID", type: "text" },
    { id: "githubId", label: "GitHub ID", type: "text" },
    { id: "otherSocialMediaId", label: "Any other social Media ID", type: "text" },
    { id: "mobileNumber", label: "Mobile number", type: "text" },
  ],
  speaker: [
    { id: "name", label: "Name", type: "text" },
    { id: "email", label: "Email ID", type: "text" },
    { id: "corporateEmail", label: "Corporate Email ID", type: "text" },
    { id: "designation", label: "Designation", type: "text" },
    { id: "eventOrganizer", label: "Event Organizer", type: "text" },
    { id: "isMvp", label: "Are you a Microsoft MVP?", type: "checkbox" },
    { id: "mvpId", label: "MVP ID", type: "text" },
    { id: "mvpProfileLink", label: "MVP Profile Link", type: "text" },
    { id: "mvpCategory", label: "MVP Category", type: "text" },
    { id: "runningMeetupGroup", label: "Are you running any meetup group?", type: "checkbox" },
    { id: "meetupName", label: "Meetup/Event Name", type: "text" },
    { id: "eventDetails", label: "Event Details", type: "text" },
    { id: "meetupPageDetails", label: "Meetup page details", type: "text" },
    { id: "linkedinId", label: "LinkedIn ID", type: "text" },
    { id: "githubId", label: "GitHub ID", type: "text" },
    { id: "otherSocialMediaId", label: "Any other social Media ID", type: "text" },
    { id: "mobileNumber", label: "Mobile number", type: "text" },
  ],
}

// Update the getFieldValue function to handle dynamic field names with prefixes
const getFieldValue = (registration: any, fieldNames: string[], defaultValue = "N/A") => {
  if (!registration) return defaultValue

  // First check in data object
  if (registration.data) {
    // Check for dynamic field names with patterns like question_fieldname_123456789
    for (const key of Object.keys(registration.data)) {
      for (const fieldName of fieldNames) {
        // Check if the key starts with the field prefix
        if (key.startsWith(fieldName)) {
          if (
            registration.data[key] !== undefined &&
            registration.data[key] !== null &&
            registration.data[key] !== ""
          ) {
            return registration.data[key]
          }
        }
      }
    }

    // Then check for exact match
    for (const fieldName of fieldNames) {
      if (
        registration.data[fieldName] !== undefined &&
        registration.data[fieldName] !== null &&
        registration.data[fieldName] !== ""
      ) {
        return registration.data[fieldName]
      }

      // Check for case-insensitive match
      const lowerFieldName = fieldName.toLowerCase()
      for (const key of Object.keys(registration.data)) {
        if (
          key.toLowerCase() === lowerFieldName &&
          registration.data[key] !== undefined &&
          registration.data[key] !== null &&
          registration.data[key] !== ""
        ) {
          return registration.data[key]
        }
      }
    }
  }

  // Then check in the registration object itself
  for (const fieldName of fieldNames) {
    if (registration[fieldName] !== undefined && registration[fieldName] !== null && registration[fieldName] !== "") {
      return registration[fieldName]
    }
  }

  // Check for nested objects
  for (const fieldName of fieldNames) {
    const parts = fieldName.split(".")
    if (parts.length > 1) {
      let obj = registration
      let found = true

      for (const part of parts) {
        if (obj && obj[part] !== undefined) {
          obj = obj[part]
        } else {
          found = false
          break
        }
      }

      if (found && obj !== undefined && obj !== null && obj !== "") {
        return obj
      }
    }
  }

  return defaultValue
}

// Update the getAttendeeEmail function to use the fieldMappings if provided
const getAttendeeEmail = (registration: any, fieldMappings?: { [key: string]: string[] }) => {
  const defaultFields = [
    "email",
    "emailAddress",
    "corporateEmail",
    "userEmail",
    "email_address",
    "corporate_email",
    "user_email",
    "Email",
    "EmailAddress",
    "CorporateEmail",
    "UserEmail",
    "data.email",
    "data.emailAddress",
    "data.corporateEmail",
    "data.userEmail",
  ]

  const emailFields = fieldMappings?.email || defaultFields
  return getFieldValue(registration, emailFields, "N/A")
}

// Update the getAttendeeName function to use the fieldMappings if provided
const getAttendeeName = (registration: any, fieldMappings?: { [key: string]: string[] }) => {
  // Try to get full name first
  const defaultNameFields = [
    "name",
    "fullName",
    "full_name",
    "Name",
    "FullName",
    "data.name",
    "data.fullName",
    "data.full_name",
    "userName",
  ]

  const nameFields = fieldMappings?.name || defaultNameFields
  const fullName = getFieldValue(registration, nameFields, "")

  if (fullName) return fullName

  // Try to combine first and last name
  const firstName = getFieldValue(
    registration,
    ["firstName", "first_name", "FirstName", "data.firstName", "data.first_name", "data.FirstName"],
    "",
  )

  const lastName = getFieldValue(
    registration,
    ["lastName", "last_name", "LastName", "data.lastName", "data.last_name", "data.LastName"],
    "",
  )

  if (firstName || lastName) {
    return `${firstName} ${lastName}`.trim()
  }

  return "Anonymous"
}

// Update the getCorporateEmail function to use the fieldMappings if provided
const getCorporateEmail = (registration: any, fieldMappings?: { [key: string]: string[] }) => {
  const defaultFields = [
    "corporateEmail",
    "corporate_email",
    "workEmail",
    "work_email",
    "companyEmail",
    "company_email",
    "businessEmail",
    "business_email",
    "CorporateEmail",
    "WorkEmail",
    "CompanyEmail",
    "BusinessEmail",
    "data.corporateEmail",
    "data.corporate_email",
    "data.workEmail",
    "data.work_email",
    "data.companyEmail",
    "data.company_email",
  ]

  const corporateEmailFields = fieldMappings?.corporateEmail || defaultFields
  return getFieldValue(registration, corporateEmailFields)
}

// Update the getDesignation function to use the fieldMappings if provided
const getDesignation = (registration: any, fieldMappings?: { [key: string]: string[] }) => {
  const defaultFields = [
    "designation",
    "role",
    "jobTitle",
    "job_title",
    "position",
    "title",
    "Designation",
    "Role",
    "JobTitle",
    "Position",
    "Title",
    "data.designation",
    "data.role",
    "data.jobTitle",
    "data.job_title",
    "data.position",
    "data.title",
  ]

  const designationFields = fieldMappings?.designation || defaultFields
  return getFieldValue(registration, designationFields)
}

// Update the getLinkedIn function to use the fieldMappings if provided
const getLinkedIn = (registration: any, fieldMappings?: { [key: string]: string[] }) => {
  const defaultFields = [
    "linkedin",
    "linkedinId",
    "linkedInUrl",
    "linkedin_url",
    "linkedinUrl",
    "linkedInProfile",
    "linkedin_profile",
    "LinkedIn",
    "LinkedInId",
    "LinkedInUrl",
    "LinkedInProfile",
    "data.linkedin",
    "data.linkedinId",
    "data.linkedInUrl",
    "data.linkedin_url",
    "data.linkedinUrl",
    "data.linkedInProfile",
    "data.linkedin_profile",
  ]

  const linkedinFields = fieldMappings?.linkedinId || defaultFields
  return getFieldValue(registration, linkedinFields)
}

// Update the getGitHub function to use the fieldMappings if provided
const getGitHub = (registration: any, fieldMappings?: { [key: string]: string[] }) => {
  const defaultFields = [
    "github",
    "githubId",
    "githubUrl",
    "github_url",
    "githubProfile",
    "github_profile",
    "GitHub",
    "GitHubId",
    "GitHubUrl",
    "GitHubProfile",
    "data.github",
    "data.githubId",
    "data.githubUrl",
    "data.github_url",
    "data.githubProfile",
    "data.github_profile",
  ]

  const githubFields = fieldMappings?.githubId || defaultFields
  return getFieldValue(registration, githubFields)
}

// Update the getOtherSocialMedia function to use the fieldMappings if provided
const getOtherSocialMedia = (registration: any, fieldMappings?: { [key: string]: string[] }) => {
  const defaultFields = [
    "otherSocialMedia",
    "otherSocialMediaId",
    "other_social_media",
    "other_social_media_id",
    "socialMedia",
    "social_media",
    "twitter",
    "facebook",
    "instagram",
    "OtherSocialMedia",
    "OtherSocialMediaId",
    "SocialMedia",
    "Twitter",
    "Facebook",
    "Instagram",
    "data.otherSocialMedia",
    "data.otherSocialMediaId",
    "data.other_social_media",
    "data.other_social_media_id",
    "data.socialMedia",
    "data.social_media",
    "data.twitter",
    "data.facebook",
    "data.instagram",
  ]

  const otherSocialMediaFields = fieldMappings?.otherSocialMediaId || defaultFields
  return getFieldValue(registration, otherSocialMediaFields)
}

// Update the getMobileNumber function to use the fieldMappings if provided
const getMobileNumber = (registration: any, fieldMappings?: { [key: string]: string[] }) => {
  const defaultFields = [
    "mobile",
    "mobileNumber",
    "mobile_number",
    "phone",
    "phoneNumber",
    "phone_number",
    "contact",
    "contactNumber",
    "contact_number",
    "Mobile",
    "MobileNumber",
    "Phone",
    "PhoneNumber",
    "Contact",
    "ContactNumber",
    "data.mobile",
    "data.mobileNumber",
    "data.mobile_number",
    "data.phone",
    "data.phoneNumber",
    "data.phone_number",
    "data.contact",
    "data.contactNumber",
    "data.contact_number",
  ]

  const mobileNumberFields = fieldMappings?.mobileNumber || defaultFields
  return getFieldValue(registration, mobileNumberFields)
}

// Update the SubmissionsTable component to include filters
export function SubmissionsTable({
  eventId,
  formType,
  title,
  description,
  filterStatus,
  fieldMappings,
}: SubmissionsTableProps) {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([])
  const [customQuestions, setCustomQuestions] = useState<any[]>([])
  const [filters, setFilters] = useState<FilterState>({})
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [activeTab, setActiveTab] = useState("basic")

  // Add a function to extract unique values for each field for filtering
  const [fieldOptions, setFieldOptions] = useState<{ [key: string]: Set<string> }>({})
  const [fieldStats, setFieldStats] = useState<{ [key: string]: { min: number; max: number } }>({})

  // Add filter handling functions
  const handleFilterChange = (field: string, value: string | boolean | null | number[] | Date) => {
    setFilters((prev) => {
      const newFilters = { ...prev }

      if (value === null || value === "") {
        delete newFilters[field]
      } else {
        newFilters[field] = value
      }

      // Update active filters list
      const activeFiltersList = Object.entries(newFilters)
        .filter(([_, val]) => val !== null && val !== undefined && val !== "")
        .map(([key, _]) => key)

      setActiveFilters(activeFiltersList)

      return newFilters
    })
  }

  const clearFilter = (field: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev }
      delete newFilters[field]

      // Update active filters list
      const activeFiltersList = Object.entries(newFilters)
        .filter(([_, val]) => val !== null && val !== undefined && val !== "")
        .map(([key, _]) => key)

      setActiveFilters(activeFiltersList)

      return newFilters
    })
  }

  const clearAllFilters = () => {
    setFilters({})
    setActiveFilters([])
  }

  // Create a function to render filter options based on question type
  const renderFilterOptions = (question: any) => {
    const fieldName = question.id || question.label
    // Determine if this is a custom question or predefined question
    const fieldKey = fieldName.startsWith("custom_") ? fieldName : fieldName

    // Get unique values for this field
    const options = fieldOptions[fieldKey] || new Set()
    const stats = fieldStats[fieldKey] || { min: 0, max: 100 }

    switch (question.type) {
      case "checkbox":
        return (
          <div key={fieldName} className="mb-4">
            <label className="text-sm font-medium mb-1 block">{formatFieldName(question.label)}</label>
            <Select
              value={filters[fieldKey]?.toString() || ""}
              onValueChange={(value) => {
                if (value === "all") {
                  handleFilterChange(fieldKey, null)
                } else {
                  handleFilterChange(fieldKey, value === "true")
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )

      case "select":
      case "radio":
        return (
          <div key={fieldName} className="mb-4">
            <label className="text-sm font-medium mb-1 block">{formatFieldName(question.label)}</label>
            <Select
              value={filters[fieldKey]?.toString() || ""}
              onValueChange={(value) => {
                if (value === "all") {
                  handleFilterChange(fieldKey, null)
                } else {
                  handleFilterChange(fieldKey, value)
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {Array.from(options).map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case "date":
        return (
          <div key={fieldName} className="mb-4">
            <label className="text-sm font-medium mb-1 block">{formatFieldName(question.label)}</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  {filters[fieldKey] ? format(filters[fieldKey] as Date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={filters[fieldKey] as Date}
                  onSelect={(date) => {
                    if (date) {
                      handleFilterChange(fieldKey, date)
                    } else {
                      handleFilterChange(fieldKey, null)
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )

      case "number":
        return (
          <div key={fieldName} className="mb-4">
            <label className="text-sm font-medium mb-1 block">{formatFieldName(question.label)}</label>
            <div className="pt-4 pb-2">
              <Slider
                defaultValue={[stats.min, stats.max]}
                min={stats.min}
                max={stats.max}
                step={1}
                value={(filters[fieldKey] as number[]) || [stats.min, stats.max]}
                onValueChange={(value) => handleFilterChange(fieldKey, value)}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{filters[fieldKey] ? (filters[fieldKey] as number[])[0] : stats.min}</span>
              <span>{filters[fieldKey] ? (filters[fieldKey] as number[])[1] : stats.max}</span>
            </div>
          </div>
        )

      default:
        return (
          <div key={fieldName} className="mb-4">
            <label className="text-sm font-medium mb-1 block">{formatFieldName(question.label)}</label>
            <Input
              placeholder={`Filter by ${formatFieldName(question.label)}`}
              value={filters[fieldKey]?.toString() || ""}
              onChange={(e) => handleFilterChange(fieldKey, e.target.value || null)}
            />
          </div>
        )
    }
  }

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true)
        console.log(`Fetching ${formType} submissions for event: ${eventId}`)

        // Build the query URL with filters
        let url = `/api/events/${eventId}/submissions/${formType}`
        const params = new URLSearchParams()

        if (filterStatus) {
          params.append("status", filterStatus)
        }

        if (searchQuery) {
          params.append("search", searchQuery)
        }

        // Add custom filters to the query
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== "") {
            if (Array.isArray(value)) {
              // Handle range filters
              params.append(`filter_${key}`, `range:${value[0]}-${value[1]}`)
            } else if (value instanceof Date) {
              // Handle date filters
              params.append(`filter_${key}`, `date:${format(value, "yyyy-MM-dd")}`)
            } else {
              params.append(`filter_${key}`, String(value))
            }
          }
        })

        if (params.toString()) {
          url += `?${params.toString()}`
        }

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`API Error (${response.status}):`, errorText)
          throw new Error(`Failed to fetch ${formType} submissions (Status: ${response.status})`)
        }

        const data = await response.json()
        console.log(`${formType} submissions data:`, data)

        setSubmissions(data.submissions || [])

        // Extract unique values for each field for filtering
        const options: { [key: string]: Set<string> } = {}
        const stats: { [key: string]: { min: number; max: number } } = {}

        data.submissions?.forEach((submission: any) => {
          if (submission.data) {
            // Process both custom fields and predefined fields
            Object.entries(submission.data).forEach(([key, value]) => {
              // Handle different types of values
              if (typeof value === "string" || typeof value === "boolean") {
                if (!options[key]) {
                  options[key] = new Set()
                }
                options[key].add(String(value))
              } else if (typeof value === "number") {
                if (!stats[key]) {
                  stats[key] = { min: value, max: value }
                } else {
                  stats[key].min = Math.min(stats[key].min, value)
                  stats[key].max = Math.max(stats[key].max, value)
                }
              }
            })
          }
        })

        setFieldOptions(options)
        setFieldStats(stats)
      } catch (error) {
        console.error(`Error fetching ${formType} submissions:`, error)
        setError(error instanceof Error ? error.message : `Failed to load ${formType} submissions`)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : `Failed to load ${formType} submissions`,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    const fetchCustomQuestions = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/forms/${formType}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        })

        if (response.ok) {
          const data = await response.json()
          // Combine predefined questions with custom questions from the API
          const predefinedQuestions = PREDEFINED_QUESTIONS[formType as keyof typeof PREDEFINED_QUESTIONS] || []

          // Create a map of existing question IDs to avoid duplicates
          const existingQuestionIds = new Set(predefinedQuestions.map((q) => q.id))

          // Filter out any custom questions that might duplicate predefined ones
          const filteredCustomQuestions = (data.questions || []).filter((q: any) => !existingQuestionIds.has(q.id))

          // Combine both sets of questions
          setCustomQuestions([...predefinedQuestions, ...filteredCustomQuestions])
        } else {
          console.error("Failed to fetch custom questions")
          // Fall back to predefined questions if API fails
          const predefinedQuestions = PREDEFINED_QUESTIONS[formType as keyof typeof PREDEFINED_QUESTIONS] || []
          setCustomQuestions(predefinedQuestions)
        }
      } catch (error) {
        console.error("Error fetching custom questions:", error)
        // Fall back to predefined questions if API fails
        const predefinedQuestions = PREDEFINED_QUESTIONS[formType as keyof typeof PREDEFINED_QUESTIONS] || []
        setCustomQuestions(predefinedQuestions)
      }
    }

    fetchSubmissions()
    fetchCustomQuestions()
  }, [eventId, formType, filterStatus, searchQuery, filters, toast])

  const handleViewSubmission = (submission: any) => {
    setSelectedSubmission(submission)
    setDialogOpen(true)
  }

  const handleUpdateStatus = async (submissionId: string, newStatus: string) => {
    try {
      // Basic validation for submissionId format
      if (!submissionId || submissionId.length < 24) {
        toast({
          title: "Error",
          description: "Invalid submission ID format",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/events/${eventId}/submissions/${formType}/${submissionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update submission status")
      }

      // Update the submission in the local state
      setSubmissions(submissions.map((sub: any) => (sub._id === submissionId ? { ...sub, status: newStatus } : sub)))

      toast({
        title: "Status Updated",
        description: `Submission status updated to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating submission status:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update submission status",
        variant: "destructive",
      })
    }
  }

  const handleBulkApprove = async () => {
    try {
      // Validate submission IDs
      const invalidIds = selectedSubmissions.filter((id) => !id || id.length < 24)
      if (invalidIds.length > 0) {
        toast({
          title: "Error",
          description: "Some selected submissions have invalid ID formats",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/events/${eventId}/submissions/${formType}/bulk-approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ submissionIds: selectedSubmissions }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to bulk approve submissions")
      }

      // Update the submission in the local state
      setSubmissions(
        submissions.map((sub: any) => (selectedSubmissions.includes(sub._id) ? { ...sub, status: "approved" } : sub)),
      )
      setSelectedSubmissions([])

      toast({
        title: "Submissions Approved",
        description: `${selectedSubmissions.length} submissions approved successfully.`,
      })
    } catch (error) {
      console.error("Error bulk approving submissions:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to bulk approve submissions",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500 text-white border-green-500">Approved</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      case "pending":
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  const formatFieldName = (key: string) => {
    // Remove question_ prefix and _numbers suffix
    let formattedKey = key.replace(/^question_/, "").replace(/_\d+$/, "")

    // Convert camelCase or snake_case to Title Case
    formattedKey = formattedKey
      .replace(/([A-Z])/g, " $1") // Add space before capital letters
      .replace(/_/g, " ") // Replace underscores with spaces
      .replace(/^\w/, (c) => c.toUpperCase()) // Capitalize first letter

    return formattedKey
  }

  const toggleSubmission = (submissionId: string) => {
    setSelectedSubmissions((prev) => {
      if (prev.includes(submissionId)) {
        return prev.filter((id) => id !== submissionId)
      } else {
        return [...prev, submissionId]
      }
    })
  }

  const allSelected = submissions.length > 0 && selectedSubmissions.length === submissions.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedSubmissions([])
    } else {
      setSelectedSubmissions(submissions.map((sub: any) => sub._id))
    }
  }

  // Define the fields that should always appear in the Custom Fields tab for attendees
  const attendeeCustomFields = [
    "email",
    "corporateEmail",
    "designation",
    "linkedinId",
    "githubId",
    "otherSocialMediaId",
    "mobileNumber",
  ]

  // Get the questions for these fields
  const attendeeCustomQuestions = customQuestions.filter((q) => attendeeCustomFields.includes(q.id))

  // Other questions for different form types
  const basicQuestions = customQuestions.filter((q) => ["name"].includes(q.id))

  const mvpQuestions = customQuestions.filter((q) => ["isMvp", "mvpId", "mvpProfileLink", "mvpCategory"].includes(q.id))

  const eventQuestions = customQuestions.filter((q) =>
    [
      "eventOrganizer",
      "eventsSupported",
      "meetupName",
      "eventDetails",
      "meetupPageDetails",
      "contribution",
      "organizerInfo",
      "runningMeetupGroup",
    ].includes(q.id),
  )

  // Any questions that don't fit into the above categories
  const otherQuestions = customQuestions.filter(
    (q) =>
      !basicQuestions.includes(q) &&
      !attendeeCustomQuestions.includes(q) &&
      !mvpQuestions.includes(q) &&
      !eventQuestions.includes(q),
  )

  const columns: ColumnDef<any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox checked={allSelected} onCheckedChange={() => toggleSelectAll()} aria-label="Select all" />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedSubmissions.includes(row.original._id)}
          onCheckedChange={() => toggleSubmission(row.original._id)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "data.name",
      header: "Name",
      cell: ({ row }) => <div>{getAttendeeName(row.original, fieldMappings)}</div>,
    },
    {
      accessorKey: "data.email",
      header: "Email",
      cell: ({ row }) => <div>{getAttendeeEmail(row.original, fieldMappings)}</div>,
    },
    ...customQuestions.map((question) => {
      const fieldKey = question.id.startsWith("custom_") ? question.id : question.id
      return {
        accessorKey: `data.${fieldKey}`,
        header: formatFieldName(question.label),
        cell: ({ row }) => {
          // Handle both custom_ prefixed fields and direct data fields
          const value = question.id.startsWith("custom_")
            ? row.original.data[question.id]
            : row.original.data[question.id]

          if (typeof value === "boolean") {
            return <div>{value ? "Yes" : "No"}</div>
          }
          return <div>{value || "N/A"}</div>
        },
      }
    }),
    {
      accessorKey: "createdAt",
      header: "Submitted",
      cell: ({ row }) => <div>{formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true })}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <div>{getStatusBadge(row.original.status)}</div>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => handleViewSubmission(row.original)}>
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          {row.original.status === "pending" && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 hover:text-green-700"
                onClick={() => handleUpdateStatus(row.original._id, "approved")}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => handleUpdateStatus(row.original._id, "rejected")}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading submissions...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={handleBulkApprove} disabled={selectedSubmissions.length === 0}>
            <CheckCircle className="h-4 w-4 mr-1" />
            Bulk Approve
          </Button>

          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-1" />
                Filters
                {activeFilters.length > 0 && (
                  <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[300px] sm:w-[400px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Advanced Filters</SheetTitle>
                <SheetDescription>Filter {formType}s based on registration data</SheetDescription>
              </SheetHeader>
              <div className="py-4">
                {activeFilters.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Active Filters</h3>
                      <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                        Clear All
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {activeFilters.map((field) => (
                        <Badge key={field} variant="secondary" className="flex items-center gap-1">
                          {formatFieldName(field.replace("custom_", ""))}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter(field)} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="basic">Basic</TabsTrigger>
                    <TabsTrigger value="dateTime">Date & Time</TabsTrigger>
                    <TabsTrigger value="customFields">Custom Fields</TabsTrigger>
                  </TabsList>

                  {/* Basic tab content */}
                  <TabsContent value="basic">
                    <div className="space-y-4">
                      <div className="mb-4">
                        <label className="text-sm font-medium mb-1 block">Status</label>
                        <Select
                          value={filters.status?.toString() || ""}
                          onValueChange={(value) => {
                            if (value === "all") {
                              handleFilterChange("status", null)
                            } else {
                              handleFilterChange("status", value)
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Filter by status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Show name field first if available */}
                      {basicQuestions.map((question) => renderFilterOptions(question))}
                    </div>
                  </TabsContent>

                  <TabsContent value="dateTime">
                    <div className="space-y-4">
                      <div className="mb-4">
                        <label className="text-sm font-medium mb-1 block">Submission Date</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <Calendar className="mr-2 h-4 w-4" />
                              {filters.submissionDate ? (
                                format(filters.submissionDate as Date, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={filters.submissionDate as Date}
                              onSelect={(date) => {
                                if (date) {
                                  handleFilterChange("submissionDate", date)
                                } else {
                                  handleFilterChange("submissionDate", null)
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Custom Fields tab - always show the specified fields for attendees */}
                  <TabsContent value="customFields">
                    <div className="space-y-4">
                      {formType === "attendee" && (
                        <>
                          <h3 className="text-sm font-medium mb-2">Attendee Questions</h3>
                          {/* Always show these specific fields for attendees */}
                          {attendeeCustomQuestions.map((question) => renderFilterOptions(question))}
                        </>
                      )}

                      {formType === "volunteer" && (
                        <>
                          <h3 className="text-sm font-medium mb-2">Volunteer Questions</h3>
                          {/* Filter out questions that don't have any data */}
                          {[...mvpQuestions, ...eventQuestions]
                            .filter((question) => {
                              const fieldKey = question.id.startsWith("custom_") ? question.id : question.id
                              return fieldOptions[fieldKey] && fieldOptions[fieldKey].size > 0
                            })
                            .map((question) => renderFilterOptions(question))}
                        </>
                      )}

                      {formType === "speaker" && (
                        <>
                          <h3 className="text-sm font-medium mb-2">Speaker Questions</h3>
                          {/* Filter out questions that don't have any data */}
                          {[...mvpQuestions, ...eventQuestions]
                            .filter((question) => {
                              const fieldKey = question.id.startsWith("custom_") ? question.id : question.id
                              return fieldOptions[fieldKey] && fieldOptions[fieldKey].size > 0
                            })
                            .map((question) => renderFilterOptions(question))}
                        </>
                      )}

                      {/* Show message if no custom questions with data are found */}
                      {(formType === "attendee" && attendeeCustomQuestions.length === 0) ||
                      ((formType === "volunteer" || formType === "speaker") &&
                        [...mvpQuestions, ...eventQuestions].filter((q) => {
                          const fieldKey = q.id.startsWith("custom_") ? q.id : q.id
                          return fieldOptions[fieldKey] && fieldOptions[fieldKey].size > 0
                        }).length === 0) ? (
                        <div className="text-center py-4 text-muted-foreground">
                          <p>No custom questions found for this event.</p>
                        </div>
                      ) : null}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </SheetContent>
          </Sheet>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-8 max-w-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No submissions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column.id}>{column.header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission: any) => (
                  <TableRow key={submission._id}>
                    {columns.map((column) => (
                      <TableCell key={`${submission._id}-${column.id}`}>
                        {column.cell({ row: { original: submission } })}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Submission Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              Submitted{" "}
              {selectedSubmission &&
                selectedSubmission.createdAt &&
                formatDistanceToNow(new Date(selectedSubmission.createdAt), { addSuffix: true })}
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                  <p>{getAttendeeName(selectedSubmission, fieldMappings)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                  <p>{getAttendeeEmail(selectedSubmission, fieldMappings)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <p>{getStatusBadge(selectedSubmission.status)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Submission ID</h3>
                  <p className="text-xs">{selectedSubmission._id}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Form Responses</h3>
                <div className="space-y-3">
                  {selectedSubmission.data &&
                    Object.entries(selectedSubmission.data).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-3 gap-2">
                        <div className="font-medium text-sm">{formatFieldName(key)}</div>
                        <div className="col-span-2">{String(value)}</div>
                      </div>
                    ))}
                </div>
              </div>

              {selectedSubmission.status === "pending" && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="text-green-600 hover:text-green-700"
                    onClick={() => {
                      handleUpdateStatus(selectedSubmission._id, "approved")
                      setDialogOpen(false)
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => {
                      handleUpdateStatus(selectedSubmission._id, "rejected")
                      setDialogOpen(false)
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
