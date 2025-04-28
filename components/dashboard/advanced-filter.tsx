"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { X, Filter, Search, Calendar, ChevronDown, ChevronUp } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface FilterState {
  [key: string]: string | boolean | null | number[] | Date | { min: number; max: number } | string[]
}

interface QuestionOption {
  id: string
  value: string
}

interface QuestionType {
  id: string
  label: string
  type: string
  required?: boolean
  options?: QuestionOption[]
  placeholder?: string
  min?: number
  max?: number
}

interface AdvancedFilterProps {
  eventId: string
  onFilterChange: (filters: FilterState) => void
  initialFilters?: FilterState
}

export function AdvancedFilter({ eventId, onFilterChange, initialFilters = {} }: AdvancedFilterProps) {
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [filterTab, setFilterTab] = useState("basic")
  const [customQuestions, setCustomQuestions] = useState<QuestionType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fieldOptions, setFieldOptions] = useState<{ [key: string]: Set<string> }>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({})

  // Group questions by category for better organization
  const questionsByCategory = customQuestions.reduce(
    (acc, question) => {
      // Extract category from question ID or use type as fallback
      let category = question.id.split("_")[1] || question.type

      // Special handling for common fields
      if (["name", "email", "corporateEmail"].includes(category)) {
        category = "personal"
      } else if (["linkedinId", "githubId", "otherSocialMediaId"].includes(category)) {
        category = "social"
      } else if (["designation", "organization", "company", "role"].includes(category)) {
        category = "professional"
      }

      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(question)
      return acc
    },
    {} as Record<string, QuestionType[]>,
  )

  // Initialize expanded state for all categories
  useEffect(() => {
    const categories = Object.keys(questionsByCategory)
    const initialExpandedState = categories.reduce(
      (acc, category) => {
        acc[category] = true // Start with all expanded
        return acc
      },
      {} as { [key: string]: boolean },
    )
    setExpandedCategories(initialExpandedState)
  }, [questionsByCategory])

  useEffect(() => {
    const fetchCustomQuestions = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/events/${eventId}/forms/attendee`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch questions: ${response.status}`)
        }

        const data = await response.json()

        // Process questions to ensure they have all required properties
        const processedQuestions = (data.questions || []).map((q: any) => ({
          ...q,
          id: q.id || q.name || q.label.toLowerCase().replace(/\s+/g, "_"),
        }))

        setCustomQuestions(processedQuestions)

        // Fetch field options (unique values) for each question
        fetchFieldOptions(eventId, processedQuestions)
      } catch (error) {
        console.error("Error fetching custom questions:", error)
        setError(error instanceof Error ? error.message : "Failed to load questions")
      } finally {
        setLoading(false)
      }
    }

    fetchCustomQuestions()
  }, [eventId])

  // Fetch unique values for each field to populate filter options
  const fetchFieldOptions = async (eventId: string, questions: QuestionType[]) => {
    try {
      const response = await fetch(`/api/events/${eventId}/field-options`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        console.warn("Field options API not available, using static options")
        return
      }

      const data = await response.json()
      setFieldOptions(data.options || {})
    } catch (error) {
      console.error("Error fetching field options:", error)
      // Fall back to using question options if available
      const options: { [key: string]: Set<string> } = {}

      questions.forEach((question) => {
        if (question.options && question.options.length > 0) {
          options[question.id] = new Set(question.options.map((opt) => opt.value))
        }
      })

      setFieldOptions(options)
    }
  }

  useEffect(() => {
    // Update active filters list whenever filters change
    const activeFiltersList = Object.entries(filters)
      .filter(([_, val]) => val !== null && val !== undefined && val !== "")
      .map(([key, _]) => key)

    setActiveFilters(activeFiltersList)

    // Notify parent component of filter changes
    onFilterChange(filters)
  }, [filters, onFilterChange])

  const handleFilterChange = (
    field: string,
    value: string | boolean | null | number[] | Date | { min: number; max: number } | string[],
  ) => {
    setFilters((prev) => {
      const newFilters = { ...prev }

      if (value === null || value === "") {
        delete newFilters[field]
      } else {
        newFilters[field] = value
      }

      return newFilters
    })
  }

  const clearFilter = (field: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev }
      delete newFilters[field]
      return newFilters
    })
  }

  const clearAllFilters = () => {
    setFilters({})
    setDateRange({ from: undefined, to: undefined })
    setSearchQuery("")
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
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

  const formatCategoryName = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, " $1")
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
      if (Array.isArray(value)) {
        return value.join(", ")
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
        // Combine options from the question definition and any unique values found in the data
        const selectOptions = new Set<string>()

        // Add options from question definition
        if (question.options && question.options.length > 0) {
          question.options.forEach((opt) => selectOptions.add(opt.value))
        }

        // Add options from field data
        if (options.size > 0) {
          options.forEach((opt) => selectOptions.add(opt))
        }

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
                {Array.from(selectOptions).map((option) => (
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

      case "email":
      case "phone":
      case "text":
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

  return (
    <div>
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
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      handleFilterChange("search", e.target.value || null)
                    }}
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
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2">Loading filters...</span>
                </div>
              ) : error ? (
                <div className="text-center py-4 text-destructive">
                  <p>{error}</p>
                </div>
              ) : Object.keys(questionsByCategory).length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No custom questions found for this event.</p>
                </div>
              ) : (
                <>
                  {Object.entries(questionsByCategory).map(([category, questions]) => (
                    <Collapsible
                      key={category}
                      open={expandedCategories[category]}
                      onOpenChange={() => toggleCategory(category)}
                      className="mb-6 border rounded-md p-2"
                    >
                      <CollapsibleTrigger className="flex w-full items-center justify-between p-2 hover:bg-muted/50 rounded">
                        <h3 className="text-sm font-medium capitalize">{formatCategoryName(category)} Questions</h3>
                        {expandedCategories[category] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-2">
                        {questions.map((question) => renderFilterOptions(question))}
                      </CollapsibleContent>
                    </Collapsible>
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

      {activeFilters.length > 0 && (
        <div className="mt-4 p-3 bg-muted/20 border rounded-md">
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
    </div>
  )
}
