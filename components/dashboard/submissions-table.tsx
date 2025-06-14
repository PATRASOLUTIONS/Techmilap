"use client"

import { useState, useEffect } from "react"
import React from "react"; // Import React
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge" // Keep Badge import
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2, Eye, CheckCircle, XCircle, Search, Filter, X, CalendarIcon, Download as DownloadIcon } from "lucide-react" // Added CalendarIcon, Renamed Download icon
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow, sub } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox" // Keep Checkbox import
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet" // Added SheetFooter
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, isValid } from "date-fns"
import { Slider } from "@/components/ui/slider" // Keep Slider import
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ListFilter } from "lucide-react" // Import ListFilter
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logWithTimestamp } from "@/utils/logger"

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

// Define ColumnConfig interface
interface ColumnConfig {
  id: string
  label: string
  defaultVisible: boolean
  isToggleable: boolean
  headerClassName?: string
  renderCell: (submission: any) => React.ReactNode
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

  // Date formatting logic directly integrated
  const formatDateValue = (value: any): any => {
    if (typeof value === 'string') {
      // Check if it's a typical ISO 8601 date string or a date-only string
      // e.g., "2023-10-26T10:00:00.000Z", "1996-05-30T00:00:00.000Z", or "2023-10-26"
      if (value.match(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3}Z?)?)?$/)) {
        const parsedDate = new Date(value);
        if (isValid(parsedDate)) {
          return format(parsedDate, "dd MMMM yyyy"); // Format as "12 May 2022"
        }
      }
    }
    // Return the original value if it's not a date string or not a valid date
    return value;
  };

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
            registration.data[key] !== "" // Consider if empty string should be returned or default
          ) {
            return formatDateValue(registration.data[key]);
          }
        }
      }
    }

    // Then check for exact match
    for (const fieldName of fieldNames) {
      if (
        registration.data[fieldName] !== undefined &&
        registration.data[fieldName] !== null &&
        registration.data[fieldName] !== "" // Consider if empty string should be returned or default
      ) {
        return formatDateValue(registration.data[fieldName]);
      }

      // Check for case-insensitive match
      const lowerFieldName = fieldName.toLowerCase()
      for (const key of Object.keys(registration.data)) {
        if (
          key.toLowerCase() === lowerFieldName &&
          registration.data[key] !== undefined &&
          registration.data[key] !== null &&
          registration.data[key] !== "" // Consider if empty string should be returned or default
        ) {
          return formatDateValue(registration.data[key]);
        }
      }
    }
  }

  // Then check in the registration object itself
  for (const fieldName of fieldNames) {
    if (registration[fieldName] !== undefined && registration[fieldName] !== null && registration[fieldName] !== "") {
      return formatDateValue(registration[fieldName]);
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
        return formatDateValue(obj);
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
  console.log("fieldmappings:", fieldMappings, "eventId:", eventId, "formType:", formType, "title:", title, "description:", description, "filterStatus:", filterStatus)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const { toast } = useToast()
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([])
  const [customQuestions, setCustomQuestions] = useState<any[]>([])
  const [filters, setFilters] = useState<FilterState>({}) // Active filters for API
  const [stagedFilters, setStagedFilters] = useState<FilterState>({}) // Filters being configured
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [activeTab, setActiveTab] = useState("basic")

  const [updatingSubmissionId, setUpdatingSubmissionId] = useState<string | null>(null)
  // State for table columns and their visibility
  const [allTableColumns, setAllTableColumns] = useState<ColumnConfig[]>([])
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})

  // Debounce search query
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500) // 500ms delay

    return () => {
      clearTimeout(timerId)
    }
  }, [searchQuery])

  // Add a function to extract unique values for each field for filtering
  const [fieldOptions, setFieldOptions] = useState<{ [key: string]: Set<string> }>({})
  const [fieldStats, setFieldStats] = useState<{ [key: string]: { min: number; max: number } }>({})

  // Add filter handling functions
  const handleFilterChange = (field: string, value: string | boolean | null | number[] | Date) => {
    setStagedFilters((prevStaged) => {
      const newStagedFilters = { ...prevStaged }

      if (value === null || value === "") {
        delete newStagedFilters[field]
      } else {
        newStagedFilters[field] = value
      }
      return newStagedFilters
    })
  }

  const clearFilter = (field: string) => {
    setStagedFilters((prevStaged) => {
      const newStagedFilters = { ...prevStaged }
      delete newStagedFilters[field]
      return newStagedFilters
    })
  }

  const clearAllFilters = () => {
    setStagedFilters({})
    // Optionally, if you want "Clear All" to immediately affect the table:
    // setFilters({});
    // setActiveFilters([]);
  }

  const applyStagedFilters = () => {
    setFilters(stagedFilters)
    const activeFiltersList = Object.entries(stagedFilters)
      .filter(([_, val]) => val !== null && val !== undefined && val !== "")
      .map(([key, _]) => key)
    setActiveFilters(activeFiltersList)
    setFilterSheetOpen(false) // Close the sheet after applying
  }

  // When the filter sheet opens, initialize stagedFilters with the current active filters
  useEffect(() => {
    if (filterSheetOpen) {
      setStagedFilters(filters)
    }
  }, [filterSheetOpen, filters])

  const resetAndCloseFilters = () => {
    setStagedFilters(filters) // Reset staged to current active filters
    setFilterSheetOpen(false)
  }

  const handleClearAllAndApply = () => {
    setFilters({})
    setActiveFilters([])
    setStagedFilters({})
    setFilterSheetOpen(false) // Close the sheet
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
              value={stagedFilters[fieldKey]?.toString() || ""}
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
              value={stagedFilters[fieldKey]?.toString() || ""}
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
                  <CalendarIcon className="mr-2 h-4 w-4" /> {/* Use CalendarIcon */}
                  {stagedFilters[fieldKey] ? format(stagedFilters[fieldKey] as Date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={stagedFilters[fieldKey] as Date}
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
                step={Math.max(1, Math.floor((stats.max - stats.min) / 100))} // Adjust step if needed
                value={(stagedFilters[fieldKey] as number[]) || [stats.min, stats.max]}
                onValueChange={(value) => handleFilterChange(fieldKey, value)}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{stagedFilters[fieldKey] ? (stagedFilters[fieldKey] as number[])[0] : stats.min}</span>
              <span>{stagedFilters[fieldKey] ? (stagedFilters[fieldKey] as number[])[1] : stats.max}</span>
            </div>
          </div>
        )

      default:
        return (
          <div key={fieldName} className="mb-4">
            <label className="text-sm font-medium mb-1 block">{formatFieldName(question.label)}</label>
            <Input
              placeholder={`Filter by ${formatFieldName(question.label)}`}
              value={stagedFilters[fieldKey]?.toString() || ""}
              onChange={(e) => handleFilterChange(fieldKey, e.target.value || null)}
            />
          </div>
        )
    }
  }

  // useEffect to dynamically build table columns based on customQuestions
  useEffect(() => {
    // console.log("Building columns. fieldOptions:", fieldOptions, "customQuestions:", customQuestions);
    const buildColumns = () => {
      const generatedColumns: ColumnConfig[] = []

      // Helper to get label from customQuestions or format the key
      const getLabel = (key: string, defaultLabel: string) => {
        const q = customQuestions.find(cq => cq.id === key);
        return q ? q.label : defaultLabel;
      };

      // --- Start with essential, always-present columns ---
      // generatedColumns.push({
      //   id: "name",
      //   label: getLabel("name", "Name"), // Use dynamic label if available
      //   defaultVisible: true,
      //   isToggleable: false, // Name is usually not toggleable
      //   headerClassName: "sticky left-[50px] bg-background z-20 min-w-[150px]",
      //   renderCell: (submission) => getAttendeeName(submission, fieldMappings),
      // })
      // generatedColumns.push({
      //   id: "email",
      //   label: getLabel("email", "Email ID"), // Use dynamic label if available
      //   defaultVisible: true,
      //   isToggleable: true,
      //   headerClassName: "min-w-[200px]",
      //   renderCell: (submission) => getAttendeeEmail(submission, fieldMappings),
      // })

      // --- Add columns based on actual data fields present in submissions ---
      // fieldOptions is populated when submissions are fetched.
      const dataFieldsPresent = Object.keys(fieldOptions).filter(
        key => (fieldOptions[key] && fieldOptions[key].size > 0) || fieldStats[key]
      );

      dataFieldsPresent.forEach(fieldKey => {
        // Avoid re-adding 'name' or 'email' as they are handled above
        if (fieldKey.toLowerCase() === 'name' || fieldKey.toLowerCase() === 'email') {
          return;
        }

        const question = customQuestions.find(q => q.id === fieldKey);
        const columnLabel = question ? question.label : formatFieldName(fieldKey);

        const commonFieldsForDefaultVisibility = [
          "corporateEmail", "designation", "mobileNumber", "phone", "company", "jobTitle",
          "talkTitle", "talkDescription", "contribution" // Add common submission fields
        ];
        const isDefaultVisible = commonFieldsForDefaultVisibility.includes(fieldKey) || (question && question.required);

        generatedColumns.push({
          id: fieldKey,
          label: columnLabel,
          defaultVisible: isDefaultVisible || false,
          isToggleable: true,
          headerClassName: "min-w-[150px]",
          renderCell: (submission: any) => {
            const value = getFieldValue(submission, [fieldKey], "N/A");
            if (typeof value === 'boolean') return value ? "Yes" : "No";
            if (Array.isArray(value)) return value.join(", ");
            return String(value);
          }
        });
      });
      // --- Add other static columns like Submitted Date ---
      // Status column is handled separately in the table render, not part of allTableColumns for toggling.
      generatedColumns.push({
        id: "submittedAt",
        label: "Submitted",
        defaultVisible: true,
        isToggleable: true,
        headerClassName: "min-w-[150px]",
        renderCell: (submission) => formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true }),
      });

      // Deduplicate columns by ID, prioritizing earlier definitions (e.g., our static name/email)
      const finalColumns = Array.from(new Map(generatedColumns.map(col => [col.id, col])).values());
      setAllTableColumns(finalColumns);
    };

    // Build columns if fieldOptions or customQuestions are populated, or if submissions are loaded (even if empty)
    // This ensures that at least the basic columns (Name, Email, Submitted At) are set up.
    if (!loading || Object.keys(fieldOptions).length > 0 || customQuestions.length > 0) {
      buildColumns();
    }
  }, [customQuestions, fieldMappings, fieldOptions, fieldStats, submissions, loading]); // Added dependencies

  // useEffect to initialize column visibility when allTableColumns changes
  useEffect(() => {
    const initialVisibility = allTableColumns.reduce((acc, col) => {
      acc[col.id] = col.defaultVisible;
      return acc;
    }, {} as Record<string, boolean>);
    setColumnVisibility(initialVisibility);
  }, [allTableColumns]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true)
        console.log(`Fetching ${formType} submissions for event: ${eventId}`)

        // Build the query URL with filters.
        // Use the specific volunteer applications endpoint if formType is 'volunteer',
        // otherwise use the generic submissions endpoint.
        const getUrl = () => {
          if (formType === "volunteer") {
            return `/api/events/${eventId}/volunteer-applications`
          } else if (formType === "speaker") {
            return `/api/events/${eventId}/speaker-applications`
          } else {
            return `/api/events/${eventId}/registrations`
          }
        }

        let url = getUrl();

        //   formType === "volunteer"
        // ? `/api/events/${eventId}/volunteer-applications`
        // : `/api/events/${eventId}/submissions/${formType}`
        const params = new URLSearchParams()

        if (filterStatus) {
          params.append("status", filterStatus)
        }

        if (debouncedSearchQuery) {
          params.append("search", debouncedSearchQuery)
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

        // Process each submission to ensure name and email are properly set in the data object
        // const processedSubmissions =
        //   data.submissions?.map((sub: any) => {
        //     // Ensure the submission has a data object
        //     if (!sub.data) sub.data = {}

        //     // Extract email and name using the helper functions (which use fieldMappings)
        //     const email = getAttendeeEmail(sub, fieldMappings)
        //     const name = getAttendeeName(sub, fieldMappings)

        //     // Update the data object with the extracted email and name
        //     // This ensures the accessorKey 'data.name' and 'data.email' work correctly
        //     return {
        //       ...sub,
        //       data: {
        //         ...sub.data,
        //         // Only update if the helper found a value better than what's already there
        //         email: email !== "N/A" ? email : sub.data.email,
        //         name: name !== "Anonymous" ? name : sub.data.name,
        //       },
        //     }
        //   }) || []
        console.log("Processed submissions:", data.submissions)
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
  }, [eventId, formType, filterStatus, debouncedSearchQuery, filters, toast]) // Changed searchQuery to debouncedSearchQuery

  const handleViewSubmission = (submission: any) => {
    logWithTimestamp("info", "View Submission Clicked", submission)
    setSelectedSubmission(submission)
    setDialogOpen(true)
  }

  const handleUpdateStatus = async (submissionId: string, name: string, email: string, newStatus: string) => {
    try {
      console.log("handleUpdateStatusInputs", submissionId, name, email, newStatus)
      setUpdatingSubmissionId(`${submissionId}_${newStatus}`) // Store ID and action
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
        body: JSON.stringify({ status: newStatus, name: name, email: email }),
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
    } finally {
      setUpdatingSubmissionId(null)
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

  // Add CSV Export functionality
  const exportToCSV = async () => {
    try {
      const { objectsToCSV, downloadCSV, formatDateForCSV } = await import("@/lib/csv-export");
      if (submissions.length === 0) {
        toast({
          title: "No data to export",
          description: `There are no ${formType} submissions to export.`,
          variant: "destructive",
        })
        return
      }

      // Collect all possible field names from submissions data
      const allDataFields = new Set<string>()
      submissions.forEach((submission: any) => {
        if (submission.data) {
          Object.keys(submission.data).forEach((key) => allDataFields.add(key));
        }
      })

      // Define standard fields that should always be included
      const standardFields = ["ID", "Name", "Email", "Status", "Submitted At", "Updated At"]

      // Combine standard fields with dynamic data fields, ensuring no duplicates
      // We will let objectsToCSV handle the header order based on the first object's keys,
      // but we ensure all potential keys are present in the data objects.
      // The formatFieldName is primarily for display in the UI, the raw keys are better for CSV processing
      // unless we specifically want formatted headers. Let's use formatted headers for clarity.
      const dynamicHeaders = Array.from(allDataFields).map(formatFieldName);

      // Prepare data for CSV export
      const csvData = submissions.map((submission: any) => {
        const record: Record<string, any> = {
          "ID": submission._id || "",
          "Name": getAttendeeName(submission, fieldMappings),
          "Email": getAttendeeEmail(submission, fieldMappings),
          "Status": submission.status || "Unknown",
          "Submitted At": submission.createdAt ? new Date(submission.createdAt).toISOString() : "",
          "Updated At": submission.updatedAt ? new Date(submission.updatedAt).toISOString() : "",
        }

        // Add all dynamic data fields
        if (submission.data) {
          Array.from(allDataFields).forEach((fieldKey) => {
            record[formatFieldName(fieldKey)] = submission.data[fieldKey] !== undefined && submission.data[fieldKey] !== null ? submission.data[fieldKey] : "";
          });
        }

        return record
      })

      // Generate filename with event ID, form type, and date
      const date = new Date().toISOString().split("T")[0]
      const filename = `event-${eventId}-${formType}-submissions-${date}.csv`

      // Use the objectsToCSV utility to generate the CSV
      const csv = objectsToCSV(csvData, {
        includeHeaders: true,
        headerOrder: [...standardFields, ...dynamicHeaders] // Specify header order
      });

      // Download the CSV
      downloadCSV(csv, filename)

      toast({ title: "Export Successful", description: `Exported ${submissions.length} ${formType} submissions.` });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast({ title: "Export Failed", description: error instanceof Error ? error.message : `Failed to export ${formType} submissions`, variant: "destructive" });
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

          {/* Add Export CSV button */}
          <Button variant="outline" onClick={exportToCSV}>
            <DownloadIcon className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            {/* Add DropdownMenu for Column Visibility */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <ListFilter className="h-4 w-4 mr-1" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allTableColumns
                  .filter((col) => col.isToggleable)
                  .map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      className="capitalize"
                      checked={columnVisibility[col.id]}
                      onCheckedChange={(value) => setColumnVisibility((prev) => ({ ...prev, [col.id]: !!value }))}
                    >
                      {col.label}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-1" />
                Filters
                {activeFilters.length > 0 && (
                  <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger> */}
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
                    <TabsTrigger value="customFields">Form Fields</TabsTrigger>
                  </TabsList>

                  {/* Basic tab content */}
                  <TabsContent value="basic">
                    <div className="space-y-4">
                      <div className="mb-4">
                        <label className="text-sm font-medium mb-1 block">Status</label>
                        <Select
                          value={stagedFilters.status?.toString() || ""}
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

                    </div>
                  </TabsContent>

                  <TabsContent value="dateTime">
                    <div className="space-y-4">
                      <div className="mb-4">
                        <label className="text-sm font-medium mb-1 block">Submission Date</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" /> {/* Use CalendarIcon */}
                              {stagedFilters.submissionDate ? (
                                format(stagedFilters.submissionDate as Date, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={stagedFilters.submissionDate as Date}
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

                  {/* Form Fields tab - show fields found in submission data */}
                  <TabsContent value="customFields">
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium mb-2">Available Form Fields</h3>
                      {/* Render filters for all fields found in submission data that have options or stats */}
                      {Object.keys(fieldOptions) // Get all keys found in submission.data
                        .filter(fieldKey => fieldOptions[fieldKey].size > 0 || fieldStats[fieldKey]) // Only include fields with data
                        .map(fieldKey => {
                          // Find the corresponding question object to get label and type
                          const question = customQuestions.find(q => q.id === fieldKey);
                          // If a question is found, use its details, otherwise use the key as label
                          const filterQuestion = question || { id: fieldKey, label: fieldKey, type: 'text' }; // Default to text if question not found
                          return renderFilterOptions(filterQuestion);
                        })}

                      {/* Show message if no filterable form fields are found */}
                      {Object.keys(fieldOptions).filter(keyFromData => {
                        // A field is filterable if it has options or stats
                        return (fieldOptions[keyFromData] && fieldOptions[keyFromData].size > 0) || fieldStats[keyFromData];
                      }).length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          <p>No custom questions found for this event.</p>
                        </div>
                      ) : null}
                    </div>
                  </TabsContent>
                </Tabs>
              </div> {/* End of py-4 for filter content */}
              <SheetFooter className="mt-auto pt-4 border-t sticky bottom-0 bg-background z-10">
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <Button variant="outline" onClick={handleClearAllAndApply} className="w-full sm:flex-1">
                    Clear All & Apply
                  </Button>
                  <Button onClick={applyStagedFilters} className="w-full sm:flex-1">
                    Apply Filters
                  </Button>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <div className="relative flex items-center">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-8 pr-8 max-w-sm" // Added pr-8 for button spacing
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
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
                  {/* Checkbox column */}
                  <TableHead className="sticky left-0 bg-background z-20 w-[50px]">
                    <Checkbox checked={allSelected} onCheckedChange={() => toggleSelectAll()} aria-label="Select all" />
                  </TableHead>
                  {/* Dynamically generated columns */}
                  {allTableColumns.map(
                    (col) =>
                      columnVisibility[col.id] && (
                        <TableHead key={col.id} className={col.headerClassName}>
                          {col.label}
                        </TableHead>
                      ),
                  )}
                  {/* Status column (always visible) */}
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  {/* Actions column (always visible) */}
                  <TableHead className="sticky right-0 bg-background z-20 min-w-[180px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission: any) => (
                  <TableRow key={submission._id}>
                    {/* Checkbox cell */}
                    <TableCell className="sticky left-0 bg-background z-20">
                      <Checkbox
                        checked={selectedSubmissions.includes(submission._id)}
                        onCheckedChange={() => toggleSubmission(submission._id)}
                        aria-label="Select row"
                      />
                    </TableCell>
                    {/* Dynamically generated cells */}
                    {allTableColumns.map((col) => columnVisibility[col.id] && <TableCell key={col.id}>{col.renderCell(submission)}</TableCell>)}
                    {/* Status cell */}
                    <TableCell>{getStatusBadge(submission.status)}</TableCell>
                    {/* Actions cell */}
                    <TableCell className="sticky right-0 bg-background z-20">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewSubmission(submission)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {submission.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleUpdateStatus(submission._id, submission.name? submission.name : submission.userName, submission.email ? submission.email : submission.userEmail, "approved")}
                              disabled={updatingSubmissionId?.startsWith(submission._id)} // Disable if any action on this row
                            >
                              {updatingSubmissionId === `${submission._id}_approved` ? ( // Specific check for approve
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  Approving...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleUpdateStatus(submission._id, submission.name? submission.name : submission.userName, submission.email ? submission.email : submission.userEmail, "rejected")}
                              disabled={updatingSubmissionId?.startsWith(submission._id)} // Disable if any action on this row
                            >
                              {updatingSubmissionId === `${submission._id}_rejected` ? ( // Specific check for reject
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  Rejecting...
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </>
                              )}
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
                  <div>{getStatusBadge(selectedSubmission.status)}</div>
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
                    Object.entries(selectedSubmission.data).map(([key, value]) => {
                      // Find the question label from customQuestions array
                      const question = customQuestions.find(q => q.id === key);
                      // Use the question's label if found, otherwise format the key
                      const displayLabel = question ? question.label : formatFieldName(key);

                      // If the displayLabel contains "Name" or "Email", skip rendering it in this section
                      // as it's already covered in the summary.
                      if (displayLabel.toLowerCase().includes("name") || displayLabel.toLowerCase().includes("email")) {
                        return null;
                      }

                      return (
                        <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 py-1 border-b border-dashed last:border-b-0">
                          <div className="font-medium text-sm text-muted-foreground md:col-span-1">{displayLabel}</div>
                          <div className="col-span-2">{String(getFieldValue(selectedSubmission, [key], "N/A"))}</div> {/* Use getFieldValue directly */}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* {selectedSubmission.status === "pending" && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="text-green-600 hover:text-green-700"
                    onClick={() => {
                      // Assuming newStatus for dialog actions is 'approved'
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
                      // Assuming newStatus for dialog actions is 'rejected'
                      handleUpdateStatus(selectedSubmission._id, "rejected")
                      setDialogOpen(false)
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )} */}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
