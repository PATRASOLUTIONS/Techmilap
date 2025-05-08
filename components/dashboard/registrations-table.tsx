"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2, Eye, CheckCircle, XCircle, Search, Download, Mail, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { downloadCSV, objectsToCSV, formatDateForCSV } from "@/lib/csv-export"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface RegistrationsTableProps {
  eventId: string
  title: string
  description: string
  filterStatus?: "pending" | "approved" | "rejected"
}

interface FilterState {
  [key: string]: string | boolean | null | number[] | Date | { min: number; max: number }
}

interface QuestionType {
  id: string
  label: string
  type: string
  required?: boolean
  options?: string[]
  placeholder?: string
  min?: number
  max?: number
}

export function RegistrationsTable({ eventId, title, description, filterStatus }: RegistrationsTableProps) {
  const [registrations, setRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([])
  const [customQuestions, setCustomQuestions] = useState<QuestionType[]>([])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Email dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailMessage, setEmailMessage] = useState("")
  const [includeEventDetails, setIncludeEventDetails] = useState(true)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [selectedAttendees, setSelectedAttendees] = useState<any[]>([])

  // Add these variables near the top of the component function, after the state declarations
  const [retryCount, setRetryCount] = useState(0)
  const [shouldRetry, setShouldRetry] = useState(false)
  const MAX_RETRIES = 3
  const RETRY_DELAY = 5000 // 5 seconds

  // Group questions by type for better organization
  const questionsByType = customQuestions.reduce(
    (acc, question) => {
      if (!acc[question.type]) {
        acc[question.type] = []
      }
      acc[question.type].push(question)
      return acc
    },
    {} as Record<string, QuestionType[]>,
  )

  // Calculate pagination values
  useEffect(() => {
    if (registrations.length > 0) {
      setTotalItems(registrations.length)
      setTotalPages(Math.ceil(registrations.length / itemsPerPage))
    } else {
      setTotalItems(0)
      setTotalPages(1)
    }
  }, [registrations, itemsPerPage])

  // Get current items for the page
  const getCurrentPageItems = () => {
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    return registrations.slice(indexOfFirstItem, indexOfLastItem)
  }

  // Update the field extraction functions to handle dynamic field names with numeric suffixes

  // Replace the existing getFieldValue function with this enhanced version
  const getFieldValue = (registration: any, fieldNames: string[], defaultValue = "N/A") => {
    if (!registration) return defaultValue

    // First check in data object
    if (registration.data) {
      // Check for dynamic field names with patterns like question_fieldname_123456789
      for (const key of Object.keys(registration.data)) {
        for (const fieldName of fieldNames) {
          // Check if the key matches the pattern question_fieldname_*
          if (key.startsWith(`question_${fieldName.toLowerCase()}_`) || key.startsWith(`question_${fieldName}_`)) {
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

  // Update the getAttendeeEmail function
  const getAttendeeEmail = (registration: any) => {
    return getFieldValue(
      registration,
      [
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
      ],
      "N/A",
    )
  }

  // Update the getAttendeeName function
  const getAttendeeName = (registration: any) => {
    // Try to get full name first
    const fullName = getFieldValue(
      registration,
      ["name", "fullName", "full_name", "Name", "FullName", "data.name", "data.fullName", "data.full_name", "userName"],
      "",
    )

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

  // Update the getCorporateEmail function
  const getCorporateEmail = (registration: any) => {
    return getFieldValue(registration, [
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
    ])
  }

  // Update the getDesignation function
  const getDesignation = (registration: any) => {
    return getFieldValue(registration, [
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
    ])
  }

  // Update the getLinkedIn function
  const getLinkedIn = (registration: any) => {
    return getFieldValue(registration, [
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
    ])
  }

  // Update the getGitHub function
  const getGitHub = (registration: any) => {
    return getFieldValue(registration, [
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
    ])
  }

  // Update the getOtherSocialMedia function
  const getOtherSocialMedia = (registration: any) => {
    return getFieldValue(registration, [
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
    ])
  }

  // Update the getMobileNumber function
  const getMobileNumber = (registration: any) => {
    return getFieldValue(registration, [
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
    ])
  }

  // Debug function to log the structure of a registration
  const logRegistrationStructure = (registration: any) => {
    console.log("Registration ID:", registration._id)
    console.log("Top-level fields:", Object.keys(registration))
    if (registration.data) {
      console.log("Data fields:", Object.keys(registration.data))
    }
    console.log("Full registration object:", registration)
  }

  // Modify the useEffect that fetches registrations to include retry logic
  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setLoading(true)
        setError(null) // Clear any previous errors
        console.log(`Fetching registrations for event: ${eventId}`)

        // Build the query URL
        let url = `/api/events/${eventId}/registrations`
        const params = new URLSearchParams()

        if (filterStatus) {
          params.append("status", filterStatus)
        }

        if (searchQuery) {
          params.append("search", searchQuery)
        }

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
          throw new Error(`Failed to fetch registrations (Status: ${response.status})`)
        }

        const data = await response.json()
        console.log(`Registrations data:`, data)

        // Debug: Log the first registration to see its structure
        if (data.registrations && data.registrations.length > 0) {
          logRegistrationStructure(data.registrations[0])
        }

        // Process each registration to ensure name and email are properly set
        const processedRegistrations =
          data.registrations?.map((reg: any) => {
            // Make sure the registration has a data object
            if (!reg.data) reg.data = {}

            // Extract email and name from the registration data
            const email = getAttendeeEmail(reg)
            const name = getAttendeeName(reg)

            // Update the registration object with the extracted email and name
            return {
              ...reg,
              userEmail: email !== "N/A" ? email : reg.userEmail,
              userName: name !== "Anonymous" ? name : reg.userName,
              data: {
                ...reg.data,
                email: email !== "N/A" ? email : reg.data.email,
                name: name !== "Anonymous" ? name : reg.data.name,
              },
            }
          }) || []

        setRegistrations(processedRegistrations)
        setShouldRetry(false) // Reset retry flag on success
        setRetryCount(0) // Reset retry count on success

        // Reset to first page when data changes
        setCurrentPage(1)
      } catch (error) {
        console.error(`Error fetching registrations:`, error)
        const errorMessage = error instanceof Error ? error.message : `Failed to load registrations`
        setError(errorMessage)

        // Check if it's a 500 error and we should retry
        if (errorMessage.includes("500") && retryCount < MAX_RETRIES) {
          setShouldRetry(true)
          setRetryCount((prev) => prev + 1)
          toast({
            title: "Connection Error",
            description: `Retrying in ${RETRY_DELAY / 1000} seconds... (Attempt ${retryCount + 1}/${MAX_RETRIES})`,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          })
        }
      } finally {
        setLoading(false)
      }
    }

    fetchRegistrations()

    // Set up auto-retry if needed
    let retryTimeout: NodeJS.Timeout | null = null
    if (shouldRetry) {
      retryTimeout = setTimeout(() => {
        console.log(`Retrying fetch (Attempt ${retryCount}/${MAX_RETRIES})...`)
        setShouldRetry(false) // Reset flag to avoid duplicate retries
      }, RETRY_DELAY)
    }

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout)
    }
  }, [eventId, filterStatus, searchQuery, toast, shouldRetry, retryCount])

  // Add a separate effect to handle the retry logic
  useEffect(() => {
    if (error && error.includes("500") && retryCount < MAX_RETRIES) {
      const timer = setTimeout(() => {
        setShouldRetry(true)
      }, RETRY_DELAY)

      return () => clearTimeout(timer)
    }
  }, [error, retryCount])

  // Fetch custom questions for the attendee form
  useEffect(() => {
    const fetchCustomQuestions = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/attendee-form`)
        if (!response.ok) {
          throw new Error("Failed to fetch form questions")
        }

        const data = await response.json()

        // Combine predefined questions with custom questions
        const predefinedQuestions = [
          { id: "name", label: "Name", type: "text" },
          { id: "email", label: "Email", type: "email" },
          { id: "phone", label: "Phone", type: "tel" },
        ]

        setCustomQuestions([...predefinedQuestions, ...(data.questions || [])])
      } catch (error) {
        console.error("Error fetching custom questions:", error)
      }
    }

    fetchCustomQuestions()
  }, [eventId])

  const handleViewRegistration = (registration: any) => {
    // Make sure the registration has the latest extracted email and name
    const updatedRegistration = {
      ...registration,
      userEmail: getAttendeeEmail(registration),
      userName: getAttendeeName(registration),
    }

    setSelectedRegistration(updatedRegistration)
    setDialogOpen(true)
  }

  const handleUpdateStatus = async (registrationId: string, newStatus: string) => {
    try {
      // Find the registration to get the email and name
      const registration = registrations.find((reg: any) => reg._id === registrationId)
      if (!registration) {
        throw new Error("Registration not found")
      }

      // Extract email and name from the registration
      const email = getAttendeeEmail(registration)
      const name = getAttendeeName(registration)

      // Log the extracted email and name
      console.log(`Updating status for ${name} (${email}) to ${newStatus}`)

      const response = await fetch(`/api/events/${eventId}/registrations/${registrationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          attendeeEmail: email !== "N/A" ? email : undefined,
          attendeeName: name !== "Anonymous" ? name : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update registration status")
      }

      const result = await response.json()

      // Update the registration in the local state
      setRegistrations(
        registrations.map((reg: any) => (reg._id === registrationId ? { ...reg, status: newStatus } : reg)),
      )

      // Show appropriate toast message based on status
      if (newStatus === "approved") {
        toast({
          title: "Status Updated",
          description: "Registration approved and notification email sent to attendee",
        })
      } else if (newStatus === "rejected") {
        toast({
          title: "Status Updated",
          description: "Registration rejected and notification email sent to attendee",
        })
      } else {
        toast({
          title: "Status Updated",
          description: `Registration status updated to ${newStatus}`,
        })
      }

      console.log("Status update response:", result)

      if (result.emailSent) {
        console.log("Email notification sent successfully")
      } else {
        console.warn("Email notification may not have been sent")
      }
    } catch (error) {
      console.error("Error updating registration status:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update registration status",
        variant: "destructive",
      })
    }
  }

  const handleBulkApprove = async () => {
    if (selectedRegistrations.length === 0) {
      toast({
        title: "No registrations selected",
        description: "Please select at least one registration to approve.",
        variant: "destructive",
      })
      return
    }

    try {
      // Prepare attendee data for bulk approval
      const attendeeData = selectedRegistrations.map((id) => {
        const registration = registrations.find((reg: any) => reg._id === id)
        if (!registration) return { id }

        return {
          id,
          email: getAttendeeEmail(registration),
          name: getAttendeeName(registration),
        }
      })

      const response = await fetch(`/api/events/${eventId}/registrations/bulk-approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registrationIds: selectedRegistrations,
          attendeeData,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to bulk approve registrations")
      }

      // Update the registrations in the local state
      setRegistrations(
        registrations.map((reg: any) =>
          selectedRegistrations.includes(reg._id) ? { ...reg, status: "approved" } : reg,
        ),
      )

      // Clear selection
      setSelectedRegistrations([])

      toast({
        title: "Registrations Approved",
        description: `Successfully approved ${selectedRegistrations.length} registrations and sent notification emails`,
      })
    } catch (error) {
      console.error("Error bulk approving registrations:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to bulk approve registrations",
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

  const toggleRegistration = (registrationId: string) => {
    setSelectedRegistrations((prev) => {
      if (prev.includes(registrationId)) {
        return prev.filter((id) => id !== registrationId)
      } else {
        return [...prev, registrationId]
      }
    })
  }

  const allSelected =
    getCurrentPageItems().length > 0 &&
    getCurrentPageItems().every((reg: any) => selectedRegistrations.includes(reg._id))

  const toggleSelectAll = () => {
    if (allSelected) {
      // Remove all current page items from selection
      const currentPageIds = getCurrentPageItems().map((reg: any) => reg._id)
      setSelectedRegistrations((prev) => prev.filter((id) => !currentPageIds.includes(id)))
    } else {
      // Add all current page items to selection
      const currentPageIds = getCurrentPageItems().map((reg: any) => reg._id)
      setSelectedRegistrations((prev) => {
        const newSelection = [...prev]
        currentPageIds.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id)
          }
        })
        return newSelection
      })
    }
  }

  // Replace the existing exportToCSV function with this improved version
  const exportToCSV = () => {
    if (registrations.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no registrations to export.",
        variant: "destructive",
      })
      return
    }

    try {
      // Create a more comprehensive dataset for export
      const exportData = registrations.map((reg: any) => {
        // Extract all data fields from the registration
        const formData = reg.data || {}

        // Create a base object with standard fields
        const baseData: Record<string, any> = {
          "Registration ID": reg._id || "",
          Name: getAttendeeName(reg),
          Email: getAttendeeEmail(reg),
          "Corporate Email": getCorporateEmail(reg),
          Designation: getDesignation(reg),
          LinkedIn: getLinkedIn(reg),
          GitHub: getGitHub(reg),
          "Other Social Media": getOtherSocialMedia(reg),
          "Mobile Number": getMobileNumber(reg),
          Status: reg.status || "Unknown",
          "Registration Date": reg.createdAt ? new Date(reg.createdAt).toISOString() : "",
          "Last Updated": reg.updatedAt ? new Date(reg.updatedAt).toISOString() : "",
        }

        // Add all form data fields to ensure we capture everything
        return { ...baseData, ...formData }
      })

      // Generate filename with event ID and date
      const date = new Date().toISOString().split("T")[0]
      const filename = `event-${eventId}-attendees-${date}.csv`

      // Convert to CSV string directly using the objectsToCSV utility
      const csvString = objectsToCSV(exportData, {
        includeHeaders: true,
        fieldFormatters: {
          "Registration Date": (value) => formatDateForCSV(value),
          "Last Updated": (value) => formatDateForCSV(value),
        },
      })

      // Download the CSV
      downloadCSV(csvString, filename)

      toast({
        title: "Export Successful",
        description: `${exportData.length} attendee records exported to CSV.`,
      })

      console.log(`Exported ${exportData.length} records to CSV`)
    } catch (error) {
      console.error("Error exporting to CSV:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export attendee data to CSV. See console for details.",
        variant: "destructive",
      })
    }
  }

  // New function to open the email dialog
  const openEmailDialog = () => {
    if (selectedRegistrations.length === 0) {
      toast({
        title: "No attendees selected",
        description: "Please select at least one attendee to email.",
        variant: "destructive",
      })
      return
    }

    // Get the selected attendee data for preview
    const selected = registrations.filter((reg: any) => selectedRegistrations.includes(reg._id))
    setSelectedAttendees(selected)

    // Reset the form
    setEmailSubject("")
    setEmailMessage("")
    setIncludeEventDetails(true)

    // Open the dialog
    setEmailDialogOpen(true)
  }

  // Function to send emails
  const sendEmails = async () => {
    if (!emailSubject || !emailMessage) {
      toast({
        title: "Missing information",
        description: "Please provide both subject and message for your email.",
        variant: "destructive",
      })
      return
    }

    setSendingEmail(true)

    try {
      // Prepare attendee data for email sending
      const attendeeData = selectedRegistrations.map((id) => {
        const registration = registrations.find((reg: any) => reg._id === id)
        if (!registration) return { id }

        return {
          id,
          email: getAttendeeEmail(registration),
          name: getAttendeeName(registration),
        }
      })

      const response = await fetch(`/api/events/${eventId}/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registrationIds: selectedRegistrations,
          attendeeData,
          subject: emailSubject,
          message: emailMessage,
          includeEventDetails,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send emails")
      }

      const result = await response.json()

      toast({
        title: "Emails Sent",
        description: result.message,
      })

      // Close the dialog and reset form
      setEmailDialogOpen(false)
      setEmailSubject("")
      setEmailMessage("")
    } catch (error) {
      console.error("Error sending emails:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send emails",
        variant: "destructive",
      })
    } finally {
      setSendingEmail(false)
    }
  }

  // Pagination handlers
  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages))
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading registrations...</span>
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
          {selectedRegistrations.length > 0 && (
            <>
              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleBulkApprove}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve Selected ({selectedRegistrations.length})
              </Button>

              {/* Add Email button */}
              <Button variant="outline" onClick={openEmailDialog}>
                <Mail className="h-4 w-4 mr-1" />
                Email Selected ({selectedRegistrations.length})
              </Button>
            </>
          )}

          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>

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
        {registrations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No registrations found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ maxWidth: "100%" }}>
            <Table className="min-w-full">
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-20 w-[50px]">
                    <Checkbox checked={allSelected} onCheckedChange={() => toggleSelectAll()} aria-label="Select all" />
                  </TableHead>
                  <TableHead className="sticky left-[50px] bg-background z-20 min-w-[150px]">Name</TableHead>
                  <TableHead className="min-w-[200px]">Email ID</TableHead>
                  <TableHead className="min-w-[200px]">Corporate Email ID</TableHead>
                  <TableHead className="min-w-[150px]">Designation</TableHead>
                  <TableHead className="min-w-[150px]">LinkedIn ID</TableHead>
                  <TableHead className="min-w-[150px]">GitHub ID</TableHead>
                  <TableHead className="min-w-[150px]">Other Social Media</TableHead>
                  <TableHead className="min-w-[150px]">Mobile Number</TableHead>
                  <TableHead className="min-w-[150px]">Registered</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="sticky right-0 bg-background z-20 min-w-[180px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getCurrentPageItems().map((registration: any) => (
                  <TableRow key={registration._id}>
                    <TableCell className="sticky left-0 bg-background z-20">
                      <Checkbox
                        checked={selectedRegistrations.includes(registration._id)}
                        onCheckedChange={() => toggleRegistration(registration._id)}
                        aria-label="Select row"
                      />
                    </TableCell>
                    <TableCell className="sticky left-[50px] bg-background z-20 font-medium">
                      {getAttendeeName(registration)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{getAttendeeEmail(registration)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{getCorporateEmail(registration) || "N/A"}</TableCell>
                    <TableCell>{getDesignation(registration) || "N/A"}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{getLinkedIn(registration) || "N/A"}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{getGitHub(registration) || "N/A"}</TableCell>
                    <TableCell>{getOtherSocialMedia(registration) || "N/A"}</TableCell>
                    <TableCell>{getMobileNumber(registration) || "N/A"}</TableCell>
                    <TableCell>{formatDistanceToNow(new Date(registration.createdAt), { addSuffix: true })}</TableCell>
                    <TableCell>{getStatusBadge(registration.status)}</TableCell>
                    <TableCell className="sticky right-0 bg-background z-20">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewRegistration(registration)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {registration.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleUpdateStatus(registration._id, "approved")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleUpdateStatus(registration._id, "rejected")}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Pagination Controls */}
      {registrations.length > 0 && (
        <CardFooter className="flex items-center justify-between px-6 py-4 border-t">
          <div className="flex items-center">
            <p className="text-sm text-muted-foreground">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{" "}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
            </p>
            <div className="ml-4 flex items-center space-x-2">
              <Label htmlFor="itemsPerPage" className="text-sm">
                Show
              </Label>
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm">entries</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={goToPrevPage} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous Page</span>
            </Button>

            <div className="flex items-center">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around current page
                let pageNum = 0
                if (totalPages <= 5) {
                  // If 5 or fewer pages, show all
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  // If near start, show first 5
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  // If near end, show last 5
                  pageNum = totalPages - 4 + i
                } else {
                  // Otherwise show current and 2 on each side
                  pageNum = currentPage - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => goToPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages}>
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next Page</span>
            </Button>
          </div>
        </CardFooter>
      )}

      {/* Registration Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registration Details</DialogTitle>
            <DialogDescription>
              Submitted{" "}
              {selectedRegistration &&
                selectedRegistration.createdAt &&
                formatDistanceToNow(new Date(selectedRegistration.createdAt), { addSuffix: true })}
            </DialogDescription>
          </DialogHeader>

          {selectedRegistration && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                  <p>{getAttendeeName(selectedRegistration)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                  <p>{getAttendeeEmail(selectedRegistration)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <p>{getStatusBadge(selectedRegistration.status)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Registration ID</h3>
                  <p className="text-xs">{selectedRegistration._id}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Form Responses</h3>
                <div className="space-y-3">
                  {selectedRegistration.data &&
                    Object.entries(selectedRegistration.data).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-3 gap-2">
                        <div className="font-medium text-sm">{key}</div>
                        <div className="col-span-2">{String(value)}</div>
                      </div>
                    ))}
                </div>
              </div>

              {selectedRegistration.status === "pending" && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="text-green-600 hover:text-green-700"
                    onClick={() => {
                      handleUpdateStatus(selectedRegistration._id, "approved")
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
                      handleUpdateStatus(selectedRegistration._id, "rejected")
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

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Email to Attendees</DialogTitle>
            <DialogDescription>
              Compose an email to send to {selectedRegistrations.length} selected attendee(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                placeholder="Email subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="email-message">Message</Label>
              <Textarea
                id="email-message"
                placeholder="Enter your message here. Use {name} to include the recipient's name."
                className="min-h-[200px]"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use {"{name}"} to personalize the email with the attendee's name.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-event-details"
                checked={includeEventDetails}
                onCheckedChange={(checked) => setIncludeEventDetails(!!checked)}
              />
              <Label htmlFor="include-event-details">Include event details in the email</Label>
            </div>

            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-2">Recipients ({selectedAttendees.length})</h3>
              <div className="max-h-[100px] overflow-y-auto">
                {selectedAttendees.map((attendee) => (
                  <div key={attendee._id} className="text-sm py-1 flex justify-between">
                    <span>{getAttendeeName(attendee)}</span>
                    <span className="text-muted-foreground">{getAttendeeEmail(attendee)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendEmails} disabled={sendingEmail || !emailSubject || !emailMessage}>
              {sendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Email"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
