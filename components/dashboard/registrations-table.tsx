"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Download, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { registrationsToCSV, downloadCSV } from "@/lib/csv-export"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, ChevronUp, MoreHorizontal, ArrowUpDown } from "lucide-react"

type SortField = "name" | "email" | "mobileNumber" | "designation" | "createdAt" | "status"
type SortDirection = "asc" | "desc"

interface RegistrationsTableProps {
  eventId: string
  initialRegistrations?: any[]
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

export function RegistrationsTable({
  eventId,
  title,
  description,
  filterStatus,
  initialRegistrations = [],
}: RegistrationsTableProps) {
  const router = useRouter()
  const [registrations, setRegistrations] = useState<any[]>(initialRegistrations)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([])
  const [customQuestions, setCustomQuestions] = useState<QuestionType[]>([])
  const [filters, setFilters] = useState<FilterState>({})
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [fieldOptions, setFieldOptions] = useState<{ [key: string]: Set<string> }>({})
  const [filterTab, setFilterTab] = useState("basic")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" } | null>(null)
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  // Email dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailMessage, setEmailMessage] = useState("")
  const [includeEventDetails, setIncludeEventDetails] = useState(true)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [selectedAttendees, setSelectedAttendees] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])

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

  // Inside the RegistrationsTable component, add this helper function
  const getAttendeeEmail = (registration: any) => {
    if (!registration) return "N/A"

    // First check the data object for email fields
    if (registration.data) {
      const data = registration.data
      return (
        data.email ||
        data.corporateEmail ||
        data.userEmail ||
        data.emailAddress ||
        data.email_address ||
        data.corporate_email ||
        data.user_email ||
        data.Email ||
        data.CorporateEmail ||
        data.UserEmail ||
        data.EmailAddress ||
        ""
      )
    }

    // Then check the registration object itself
    return registration.userEmail || registration.email || "N/A"
  }

  const getAttendeeName = (registration: any) => {
    if (!registration) return "Anonymous"

    // First check the data object for name fields
    if (registration.data) {
      const data = registration.data

      // Check for full name fields
      if (data.name) return data.name
      if (data.fullName) return data.fullName
      if (data.full_name) return data.full_name
      if (data.Name) return data.Name
      if (data.FullName) return data.FullName

      // Check for first/last name combination
      const firstName = data.firstName || data.first_name || data.FirstName || ""

      const lastName = data.lastName || data.last_name || data.LastName || ""

      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim()
      }
    }

    // Then check the registration object itself
    return registration.userName || "Anonymous"
  }

  const getAttendeeMobile = (registration: any) => {
    if (!registration) return "N/A"

    // Check the data object for mobile/phone fields
    if (registration.data) {
      const data = registration.data
      return (
        data.mobile ||
        data.phone ||
        data.phoneNumber ||
        data.phone_number ||
        data.mobileNumber ||
        data.mobile_number ||
        data.Mobile ||
        data.Phone ||
        data.PhoneNumber ||
        "N/A"
      )
    }

    return registration.mobile || registration.phone || "N/A"
  }

  const getAttendeeDesignation = (registration: any) => {
    if (!registration) return "N/A"

    // Check the data object for designation/job title fields
    if (registration.data) {
      const data = registration.data
      return (
        data.designation ||
        data.jobTitle ||
        data.job_title ||
        data.position ||
        data.role ||
        data.title ||
        data.Designation ||
        data.JobTitle ||
        data.Position ||
        "N/A"
      )
    }

    return registration.designation || registration.jobTitle || registration.position || "N/A"
  }

  const sortData = (data: any[]) => {
    if (!sortConfig) return data

    return [...data].sort((a, b) => {
      // Get values based on the sort key
      let aValue, bValue

      if (sortConfig.key === "name") {
        aValue = getAttendeeName(a)
        bValue = getAttendeeName(b)
      } else if (sortConfig.key === "email") {
        aValue = getAttendeeEmail(a)
        bValue = getAttendeeEmail(b)
      } else if (sortConfig.key === "mobile") {
        aValue = a.data?.mobile || a.data?.phone || a.data?.phoneNumber || ""
        bValue = b.data?.mobile || b.data?.phone || b.data?.phoneNumber || ""
      } else if (sortConfig.key === "designation") {
        aValue = a.data?.designation || a.data?.jobTitle || a.data?.position || ""
        bValue = b.data?.designation || b.data?.jobTitle || b.data?.position || ""
      } else if (sortConfig.key === "registered") {
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
      } else if (sortConfig.key === "status") {
        aValue = a.status
        bValue = b.status
      } else {
        aValue = a[sortConfig.key]
        bValue = b[sortConfig.key]
      }

      // Compare the values
      if (aValue < bValue) {
        return sortConfig.direction === "ascending" ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === "ascending" ? 1 : -1
      }
      return 0
    })
  }

  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

  // Modify the useEffect that fetches registrations to include retry logic
  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setLoading(true)
        setError(null) // Clear any previous errors
        console.log(`Fetching registrations for event: ${eventId}`)

        // Build the query URL with filters
        let url = `/api/events/${eventId}/registrations`
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
            if (key === "registrationDate" && dateRange.from) {
              const from = dateRange.from.toISOString().split("T")[0]
              const to = dateRange.to ? dateRange.to.toISOString().split("T")[0] : from
              params.append(`filter_registrationDate`, `date_range:${from}:${to}`)
            } else if (typeof value === "object" && "min" in value && "max" in value) {
              // Handle numeric range filters
              params.append(`filter_${key}`, `range:${value.min}-${value.max}`)
            } else if (value instanceof Date) {
              // Handle date filters
              params.append(`filter_${key}`, `date:${value.toISOString().split("T")[0]}`)
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
          throw new Error(`Failed to fetch registrations (Status: ${response.status})`)
        }

        const data = await response.json()
        console.log(`Registrations data:`, data)

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

        // Extract unique values for each field for filtering
        const options: { [key: string]: Set<string> } = {}

        processedRegistrations.forEach((registration: any) => {
          if (registration.data) {
            Object.entries(registration.data).forEach(([key, value]) => {
              if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
                if (!options[key]) {
                  options[key] = new Set()
                }
                options[key].add(String(value))
              }
            })
          }
        })

        setFieldOptions(options)
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
  }, [eventId, filterStatus, searchQuery, filters, toast, dateRange, shouldRetry, retryCount])

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

  useEffect(() => {
    fetchRegistrations()
  }, [eventId, sortField, sortDirection])

  const fetchRegistrations = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${eventId}/registrations?sort=${sortField}&direction=${sortDirection}`)

      if (!response.ok) {
        throw new Error("Failed to fetch registrations")
      }

      const data = await response.json()
      setRegistrations(data.registrations || [])
    } catch (error) {
      console.error("Error fetching registrations:", error)
      toast({
        title: "Error",
        description: "Failed to load registrations. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Set new field and default to ascending
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const renderSortIcon = (field: SortField) => {
    if (field !== sortField) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return sortDirection === "asc" ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(registrations.map((reg) => reg._id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id))
    }
  }

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/registrations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "approved" }),
      })

      if (!response.ok) {
        throw new Error("Failed to approve registration")
      }

      // Update the local state
      setRegistrations(registrations.map((reg) => (reg._id === id ? { ...reg, status: "approved" } : reg)))

      toast({
        title: "Success",
        description: "Registration approved successfully",
      })
    } catch (error) {
      console.error("Error approving registration:", error)
      toast({
        title: "Error",
        description: "Failed to approve registration. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleReject = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/registrations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "rejected" }),
      })

      if (!response.ok) {
        throw new Error("Failed to reject registration")
      }

      // Update the local state
      setRegistrations(registrations.map((reg) => (reg._id === id ? { ...reg, status: "rejected" } : reg)))

      toast({
        title: "Success",
        description: "Registration rejected successfully",
      })
    } catch (error) {
      console.error("Error rejecting registration:", error)
      toast({
        title: "Error",
        description: "Failed to reject registration. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) {
      toast({
        title: "No selections",
        description: "Please select at least one registration to approve.",
      })
      return
    }

    try {
      const response = await fetch(`/api/events/${eventId}/registrations/bulk-approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ registrationIds: selectedIds }),
      })

      if (!response.ok) {
        throw new Error("Failed to approve registrations")
      }

      // Update the local state
      setRegistrations(
        registrations.map((reg) => (selectedIds.includes(reg._id) ? { ...reg, status: "approved" } : reg)),
      )

      setSelectedIds([])

      toast({
        title: "Success",
        description: `${selectedIds.length} registrations approved successfully`,
      })
    } catch (error) {
      console.error("Error approving registrations:", error)
      toast({
        title: "Error",
        description: "Failed to approve registrations. Please try again.",
        variant: "destructive",
      })
    }
  }

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

  const handleBulkApproveOld = async () => {
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

  const handleFilterChange = (
    field: string,
    value: string | boolean | null | number[] | Date | { min: number; max: number },
  ) => {
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
    setDateRange({ from: undefined, to: undefined })
  }

  const formatFieldName = (key: string) => {
    // Remove question_ prefix and _numbers suffix
    let formattedKey = key
      .replace(/^question_/, "")
      .replace(/_\d+$/, "")
      .replace(/^custom_/, "")

    // Convert camelCase or snake_case to Title Case
    formattedKey = formattedKey
      .replace(/([A-Z])/g, " $1") // Add space before capital letters
      .replace(/_/g, " ") // Replace underscores with spaces
      .replace(/^\w/, (c) => c.toUpperCase()) // Capitalize first letter

    return formattedKey
  }

  const getFilterDisplayValue = (field: string, value: any) => {
    if (field === "registrationDate" && dateRange.from) {
      const from = format(dateRange.from, "MMM d, yyyy")
      const to = dateRange.to ? format(dateRange.to, "MMM d, yyyy") : from
      return from === to ? from : `${from} - ${to}`
    }

    if (typeof value === "object" && value !== null) {
      if ("min" in value && "max" in value) {
        return `${value.min} - ${value.max}`
      }
      if (value instanceof Date) {
        return format(value, "MMM d, yyyy")
      }
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No"
    }

    return String(value)
  }

  const renderFilterOptions = (question: QuestionType) => {
    const fieldName = question.id
    const fieldKey = `custom_${fieldName}`

    // Get unique values for this field
    const options = fieldOptions[fieldName] || new Set()

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
                {question.options &&
                  question.options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )

      case "number":
        const min = question.min !== undefined ? question.min : 0
        const max = question.max !== undefined ? question.max : 100
        const currentRange = filters[fieldKey] as { min: number; max: number } | undefined
        const currentMin = currentRange?.min !== undefined ? currentRange.min : min
        const currentMax = currentRange?.max !== undefined ? currentRange.max : max

        return (
          <div key={fieldName} className="mb-4">
            <label className="text-sm font-medium mb-1 block">{formatFieldName(question.label)}</label>
            <div className="pt-6 pb-2">
              <Slider
                defaultValue={[currentMin, currentMax]}
                min={min}
                max={max}
                step={1}
                onValueChange={(values) => {
                  handleFilterChange(fieldKey, { min: values[0], max: values[1] })
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Min: {currentMin}</span>
              <span>Max: {currentMax}</span>
            </div>
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
                  {filters[fieldKey] instanceof Date ? format(filters[fieldKey] as Date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={filters[fieldKey] as Date}
                  onSelect={(date) => handleFilterChange(fieldKey, date || null)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "success"
      case "rejected":
        return "destructive"
      case "pending":
      default:
        return "outline"
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

  const allSelected = registrations.length > 0 && selectedRegistrations.length === registrations.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedRegistrations([])
    } else {
      setSelectedRegistrations(registrations.map((reg: any) => reg._id))
    }
  }

  const handleSelectAllOld = (checked: boolean) => {
    if (checked) {
      setSelectedRegistrations(registrations.map((reg: any) => reg._id))
    } else {
      setSelectedRegistrations([])
    }
  }

  const handleSelectOneOld = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRegistrations([...selectedRegistrations, id])
    } else {
      setSelectedRegistrations(selectedRegistrations.filter((selectedId) => selectedId !== id))
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

    // Create CSV content
    const headers = ["Name", "Email", "Mobile Number", "Designation", "Registered Date", "Status"]
    const csvContent = [
      headers.join(","),
      ...registrations.map((reg) => {
        const name = reg.userName || reg.data?.name || "N/A"
        const email = reg.userEmail || reg.data?.email || "N/A"
        const mobileNumber = reg.data?.mobileNumber || reg.data?.phone || "N/A"
        const designation = reg.data?.designation || reg.data?.jobTitle || "N/A"
        const registeredDate = reg.createdAt ? format(new Date(reg.createdAt), "yyyy-MM-dd") : "N/A"
        const status = reg.status || "pending"

        return [name, email, mobileNumber, designation, registeredDate, status].join(",")
      }),
    ].join("\n")

    // Create a blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `registrations-${eventId}-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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

    try {
      // Convert data to CSV using our utility
      const csvData = registrationsToCSV(registrations)

      // Generate filename with event ID and date
      const date = new Date().toISOString().split("T")[0]
      const filename = `event-${eventId}-attendees-${date}.csv`

      // Download the CSV
      downloadCSV(csvData, filename)

      toast({
        title: "Export Successful",
        description: "Attendee data has been exported to CSV.",
      })
    } catch (error) {
      console.error("Error exporting to CSV:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export attendee data to CSV.",
        variant: "destructive",
      })
    }
  }

  // Remove the duplicate function declaration
  // New function to open the email dialog
  // const openEmailDialog = () => {
  //   if (selectedRegistrations.length === 0) {
  //     toast({
  //       title: "No attendees selected",
  //       description: "Please select at least one attendee to email.",
  //       variant: "destructive",
  //     })
  //     return
  //   }

  // Get the selected attendee data for preview
  const selected = registrations.filter((reg: any) => selectedRegistrations.includes(reg._id))
  setSelectedAttendees(selected)

  // Reset the form
  setEmailSubject("")
  setEmailMessage("")
  setIncludeEventDetails(true)

  // Open the dialog
  setEmailDialogOpen(true)
  // }

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

  if (loading && registrations.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Registrations</h3>
        <div className="flex space-x-2">
          {selectedIds.length > 0 && (
            <Button onClick={handleBulkApprove} size="sm" variant="outline">
              Approve Selected ({selectedIds.length})
            </Button>
          )}
          <Button onClick={exportToCSV} size="sm" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {registrations.length === 0 ? (
        <div className="text-center p-8 border rounded-md bg-gray-50">
          <p className="text-gray-500">No registrations found for this event.</p>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.length === registrations.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                  Name {renderSortIcon("name")}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("email")}>
                  Email {renderSortIcon("email")}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("mobileNumber")}>
                  Mobile Number {renderSortIcon("mobileNumber")}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("designation")}>
                  Designation {renderSortIcon("designation")}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("createdAt")}>
                  Registered {renderSortIcon("createdAt")}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                  Status {renderSortIcon("status")}
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((registration) => {
                const name = registration.userName || registration.data?.name || "N/A"
                const email = registration.userEmail || registration.data?.email || "N/A"
                const mobileNumber = registration.data?.mobileNumber || registration.data?.phone || "N/A"
                const designation = registration.data?.designation || registration.data?.jobTitle || "N/A"

                return (
                  <TableRow key={registration._id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(registration._id)}
                        onCheckedChange={(checked) => handleSelectOne(registration._id, !!checked)}
                        aria-label={`Select ${name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell>{email}</TableCell>
                    <TableCell>{mobileNumber}</TableCell>
                    <TableCell>{designation}</TableCell>
                    <TableCell>
                      {registration.createdAt ? format(new Date(registration.createdAt), "MMM d, yyyy") : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(registration.status || "pending")}>
                        {registration.status || "pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleApprove(registration._id)}
                            disabled={registration.status === "approved"}
                          >
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleReject(registration._id)}
                            disabled={registration.status === "rejected"}
                          >
                            Reject
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              router.push(`/event-dashboard/${eventId}/attendees/${registration._id}`)
                            }}
                          >
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
