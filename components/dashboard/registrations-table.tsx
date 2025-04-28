"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Eye, CheckCircle, XCircle, Search, Filter, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface RegistrationsTableProps {
  eventId: string
  title: string
  description: string
  filterStatus?: "pending" | "approved" | "rejected"
}

interface FilterState {
  [key: string]: string | boolean | null
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
  const [customQuestions, setCustomQuestions] = useState<any[]>([])
  const [filters, setFilters] = useState<FilterState>({})
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [fieldOptions, setFieldOptions] = useState<{ [key: string]: Set<string> }>({})

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setLoading(true)
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
            params.append(`filter_${key}`, String(value))
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
        setError(error instanceof Error ? error.message : `Failed to load registrations`)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : `Failed to load registrations`,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    const fetchCustomQuestions = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/forms/attendee`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setCustomQuestions(data.questions || [])
        } else {
          console.error("Failed to fetch custom questions")
        }
      } catch (error) {
        console.error("Error fetching custom questions:", error)
      }
    }

    fetchRegistrations()
    fetchCustomQuestions()
  }, [eventId, filterStatus, searchQuery, filters, toast])

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

  const handleFilterChange = (field: string, value: string | boolean | null) => {
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

  const renderFilterOptions = (question: any) => {
    const fieldName = question.id || question.label
    const fieldKey = `custom_${fieldName}`

    // Get unique values for this field
    const options = fieldOptions[fieldKey] || new Set()

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
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleBulkApprove}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve Selected ({selectedRegistrations.length})
            </Button>
          )}
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
                <SheetTitle>Filter Registrations</SheetTitle>
                <SheetDescription>Filter registrations based on form responses</SheetDescription>
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

                  {customQuestions.map((question) => renderFilterOptions(question))}
                </div>
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
    </Card>
  )
}
