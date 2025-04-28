"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Eye, CheckCircle, XCircle, Search, X, Download, Mail, Filter, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow, format } from "date-fns"
import { registrationsToCSV, downloadCSV } from "@/lib/csv-export"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

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
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
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

        setRegistrations(data.registrations || [])
        setShouldRetry(false) // Reset retry flag on success
        setRetryCount(0) // Reset retry count on success

        // Extract unique values for each field for filtering
        const options: { [key: string]: Set<string> } = {}

        data.registrations?.forEach((registration: any) => {
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

  const handleViewRegistration = (registration: any) => {
    setSelectedRegistration(registration)
    setDialogOpen(true)
  }

  const handleUpdateStatus = async (registrationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/registrations/${registrationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update registration status")
      }

      // Update the registration in the local state
      setRegistrations(
        registrations.map((reg: any) => (reg._id === registrationId ? { ...reg, status: newStatus } : reg)),
      )

      toast({
        title: "Status Updated",
        description: `Registration status updated to ${newStatus}`,
      })
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
      const response = await fetch(`/api/events/${eventId}/registrations/bulk-approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ registrationIds: selectedRegistrations }),
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
        description: `Successfully approved ${selectedRegistrations.length} registrations`,
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
      const response = await fetch(`/api/events/${eventId}/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registrationIds: selectedRegistrations,
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

          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="secondary" className="relative">
                <Filter className="h-4 w-4 mr-1" />
                Advanced Filters
                {activeFilters.length > 0 && (
                  <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[350px] sm:w-[450px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Advanced Filters</SheetTitle>
                <SheetDescription>Filter attendees based on registration data</SheetDescription>
              </SheetHeader>

              <Tabs defaultValue="basic" value={filterTab} onValueChange={setFilterTab} className="mt-4">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="date">Date & Time</TabsTrigger>
                  <TabsTrigger value="custom">Custom Fields</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
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

                  <div className="mb-4">
                    <label className="text-sm font-medium mb-1 block">Search</label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or email..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Searches through names and email addresses</p>
                  </div>
                </TabsContent>

                <TabsContent value="date" className="space-y-4">
                  <div className="mb-4">
                    <label className="text-sm font-medium mb-1 block">Registration Date Range</label>
                    <div className="grid gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button id="date" variant="outline" className="w-full justify-start text-left font-normal">
                            <Calendar className="mr-2 h-4 w-4" />
                            {dateRange.from ? (
                              dateRange.to ? (
                                <>
                                  {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                                </>
                              ) : (
                                format(dateRange.from, "LLL dd, y")
                              )
                            ) : (
                              <span>Pick a date range</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange.from}
                            selected={dateRange}
                            onSelect={(range) => {
                              setDateRange(range)
                              if (range?.from) {
                                handleFilterChange("registrationDate", range)
                              } else {
                                handleFilterChange("registrationDate", null)
                              }
                            }}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Filter attendees by when they registered</p>
                  </div>
                </TabsContent>

                <TabsContent value="custom" className="space-y-4">
                  {customQuestions.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>No custom questions found for this event.</p>
                    </div>
                  ) : (
                    <>
                      {Object.entries(questionsByType).map(([type, questions]) => (
                        <div key={type} className="mb-6">
                          <h3 className="text-sm font-medium mb-3 capitalize border-b pb-1">{type} Questions</h3>
                          {questions.map((question) => renderFilterOptions(question))}
                        </div>
                      ))}
                    </>
                  )}
                </TabsContent>
              </Tabs>

              {activeFilters.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Active Filters</h3>
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      Clear All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {activeFilters.map((field) => {
                      const value = filters[field]
                      const displayValue = getFilterDisplayValue(field, value)
                      return (
                        <Badge key={field} variant="secondary" className="flex items-center gap-1">
                          {formatFieldName(field)}: {displayValue}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter(field)} />
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}

              <SheetFooter className="mt-6">
                <Button variant="outline" onClick={() => setFilterSheetOpen(false)}>
                  Apply Filters
                </Button>
              </SheetFooter>
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
      {activeFilters.length > 0 && (
        <div className="px-6 py-2 bg-muted/20 border-t border-b">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-sm font-medium">Active filters:</span>
            {activeFilters.map((field) => {
              const value = filters[field]
              const displayValue = getFilterDisplayValue(field, value)
              return (
                <Badge key={field} variant="secondary" className="flex items-center gap-1">
                  {formatFieldName(field)}: {displayValue}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter(field)} />
                </Badge>
              )
            })}
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="ml-auto">
              Clear All
            </Button>
          </div>
        </div>
      )}
      <CardContent>
        {registrations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No registrations found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Checkbox checked={allSelected} onCheckedChange={() => toggleSelectAll()} aria-label="Select all" />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((registration: any) => (
                  <TableRow key={registration._id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRegistrations.includes(registration._id)}
                        onCheckedChange={() => toggleRegistration(registration._id)}
                        aria-label="Select row"
                      />
                    </TableCell>
                    <TableCell>{registration.data?.name || registration.data?.firstName || "Anonymous"}</TableCell>
                    <TableCell>{registration.data?.email || "N/A"}</TableCell>
                    <TableCell>{formatDistanceToNow(new Date(registration.createdAt), { addSuffix: true })}</TableCell>
                    <TableCell>{getStatusBadge(registration.status)}</TableCell>
                    <TableCell className="text-right">
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
                  <p>{selectedRegistration.data?.firstName || selectedRegistration.data?.name || "Anonymous"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                  <p>{selectedRegistration.data?.email || "N/A"}</p>
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
                        <div className="font-medium text-sm">{formatFieldName(key)}</div>
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
                    <span>{attendee.data?.name || attendee.data?.firstName || "Anonymous"}</span>
                    <span className="text-muted-foreground">{attendee.data?.email || "No email"}</span>
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
