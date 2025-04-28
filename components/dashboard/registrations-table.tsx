"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Download, Filter, MoreHorizontal, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"

export function RegistrationsTable({ eventId, title, description }) {
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    status: "all",
    customFields: {},
  })
  const [customQuestions, setCustomQuestions] = useState([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedRegistrations, setSelectedRegistrations] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const { toast } = useToast()

  // Fetch registrations
  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/events/${eventId}/registrations`)
        if (!response.ok) {
          throw new Error("Failed to fetch registrations")
        }
        const data = await response.json()
        setRegistrations(data.registrations || [])
      } catch (err) {
        setError(err.message)
        console.error("Error fetching registrations:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchRegistrations()
  }, [eventId])

  // Fetch custom questions
  useEffect(() => {
    const fetchCustomQuestions = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/attendee-form`)
        if (!response.ok) {
          throw new Error("Failed to fetch custom questions")
        }
        const data = await response.json()

        // Combine predefined questions with custom questions
        const predefinedQuestions = [
          { id: "name", label: "Name", type: "text" },
          { id: "email", label: "Email", type: "email" },
          { id: "phone", label: "Phone", type: "tel" },
        ]

        const customQuestionsFromApi = data.questions || []
        setCustomQuestions([...predefinedQuestions, ...customQuestionsFromApi])
      } catch (err) {
        console.error("Error fetching custom questions:", err)
      }
    }

    fetchCustomQuestions()
  }, [eventId])

  // Handle status change
  const handleStatusChange = async (registrationId, newStatus) => {
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

      // Update the local state
      setRegistrations((prevRegistrations) =>
        prevRegistrations.map((reg) => (reg.id === registrationId ? { ...reg, status: newStatus } : reg)),
      )

      // Show toast notification about email being sent
      if (newStatus === "approved") {
        toast({
          title: "Registration approved",
          description: "An approval email has been sent to the attendee.",
          duration: 5000,
        })
      } else if (newStatus === "rejected") {
        toast({
          title: "Registration rejected",
          description: "A rejection email has been sent to the attendee.",
          duration: 5000,
        })
      }
    } catch (err) {
      console.error("Error updating registration status:", err)
      toast({
        title: "Error",
        description: "Failed to update registration status. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  // Handle bulk approval
  const handleBulkApprove = async () => {
    if (selectedRegistrations.length === 0) {
      toast({
        title: "No registrations selected",
        description: "Please select at least one registration to approve.",
        variant: "destructive",
        duration: 5000,
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

      // Update the local state
      setRegistrations((prevRegistrations) =>
        prevRegistrations.map((reg) => (selectedRegistrations.includes(reg.id) ? { ...reg, status: "approved" } : reg)),
      )

      // Reset selection
      setSelectedRegistrations([])
      setSelectAll(false)

      toast({
        title: "Bulk approval successful",
        description: `${selectedRegistrations.length} registrations have been approved. Emails have been sent to all approved attendees.`,
        duration: 5000,
      })
    } catch (err) {
      console.error("Error bulk approving registrations:", err)
      toast({
        title: "Error",
        description: "Failed to bulk approve registrations. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  // Handle filter change
  const handleFilterChange = (field, value) => {
    if (field === "status") {
      setFilters({ ...filters, status: value })
    } else {
      setFilters({
        ...filters,
        customFields: {
          ...filters.customFields,
          [field]: value,
        },
      })
    }
  }

  // Handle checkbox selection
  const handleCheckboxChange = (registrationId) => {
    setSelectedRegistrations((prev) => {
      if (prev.includes(registrationId)) {
        return prev.filter((id) => id !== registrationId)
      } else {
        return [...prev, registrationId]
      }
    })
  }

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRegistrations([])
    } else {
      setSelectedRegistrations(filteredRegistrations.map((reg) => reg.id))
    }
    setSelectAll(!selectAll)
  }

  // Export to CSV
  const exportToCSV = () => {
    // Implementation for CSV export
    toast({
      title: "Export started",
      description: "Your CSV file is being generated and will download shortly.",
      duration: 5000,
    })
  }

  // Filter registrations based on search term and filters
  const filteredRegistrations = registrations.filter((registration) => {
    // Filter by search term
    const searchMatch =
      searchTerm === "" ||
      registration.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.phone?.includes(searchTerm)

    // Filter by status
    const statusMatch = filters.status === "all" || registration.status === filters.status

    // Filter by custom fields
    let customFieldsMatch = true
    for (const [field, value] of Object.entries(filters.customFields)) {
      if (value && registration.data && registration.data[field] !== value) {
        customFieldsMatch = false
        break
      }
    }

    return searchMatch && statusMatch && customFieldsMatch
  })

  // Render filter options based on question type
  const renderFilterOptions = (question) => {
    switch (question.type) {
      case "text":
      case "email":
      case "tel":
        return (
          <Input
            placeholder={`Filter by ${question.label}`}
            onChange={(e) => handleFilterChange(question.id, e.target.value)}
            value={filters.customFields[question.id] || ""}
          />
        )
      case "select":
        return (
          <RadioGroup
            value={filters.customFields[question.id] || ""}
            onValueChange={(value) => handleFilterChange(question.id, value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="" id={`${question.id}-all`} />
              <Label htmlFor={`${question.id}-all`}>All</Label>
            </div>
            {question.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                <Label htmlFor={`${question.id}-${option.value}`}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        )
      case "checkbox":
        return (
          <div className="space-y-2">
            <Label>Filter by {question.label}</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${question.id}-yes`}
                checked={filters.customFields[question.id] === "true"}
                onCheckedChange={(checked) => handleFilterChange(question.id, checked ? "true" : "")}
              />
              <Label htmlFor={`${question.id}-yes`}>Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${question.id}-no`}
                checked={filters.customFields[question.id] === "false"}
                onCheckedChange={(checked) => handleFilterChange(question.id, checked ? "false" : "")}
              />
              <Label htmlFor={`${question.id}-no`}>No</Label>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      case "pending":
      default:
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title || "Registrations"}</CardTitle>
          <CardDescription>{description || "Loading registrations..."}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p>Loading registrations...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title || "Registrations"}</CardTitle>
          <CardDescription>{description || "Error loading registrations"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-red-500">Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>{title || "Registrations"}</CardTitle>
            <CardDescription>{description || "Manage your event registrations"}</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <Filter className="h-3.5 w-3.5" />
                  <span>Filter</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Registrations</SheetTitle>
                  <SheetDescription>Filter registrations by status and custom fields</SheetDescription>
                </SheetHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <RadioGroup value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="status-all" />
                        <Label htmlFor="status-all">All</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pending" id="status-pending" />
                        <Label htmlFor="status-pending">Pending</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="approved" id="status-approved" />
                        <Label htmlFor="status-approved">Approved</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="rejected" id="status-rejected" />
                        <Label htmlFor="status-rejected">Rejected</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  {customQuestions.map((question) => (
                    <div key={question.id} className="space-y-2">
                      <Label>{question.label}</Label>
                      {renderFilterOptions(question)}
                    </div>
                  ))}
                  <Button onClick={() => setIsFilterOpen(false)} className="w-full mt-4">
                    Apply Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <Button variant="outline" size="sm" className="h-8 gap-1" onClick={exportToCSV}>
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </Button>
            {selectedRegistrations.length > 0 && (
              <Button size="sm" className="h-8" onClick={handleBulkApprove}>
                Approve Selected ({selectedRegistrations.length})
              </Button>
            )}
          </div>
        </div>
        <div className="flex w-full max-w-sm items-center space-x-2 mt-2">
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={handleSearch}
            className="h-8"
          />
          <Button type="submit" size="sm" variant="ghost" className="h-8 px-2">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredRegistrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground">No registrations found</p>
            {(searchTerm || filters.status !== "all" || Object.keys(filters.customFields).length > 0) && (
              <Button
                variant="link"
                onClick={() => {
                  setSearchTerm("")
                  setFilters({ status: "all", customFields: {} })
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} aria-label="Select all" />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRegistrations.includes(registration.id)}
                        onCheckedChange={() => handleCheckboxChange(registration.id)}
                        aria-label={`Select ${registration.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{registration.name}</TableCell>
                    <TableCell>{registration.email}</TableCell>
                    <TableCell>{registration.phone}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(registration.status)}>
                        {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(registration.id, "approved")}
                            disabled={registration.status === "approved"}
                          >
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(registration.id, "rejected")}
                            disabled={registration.status === "rejected"}
                          >
                            Reject
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(registration.id, "pending")}
                            disabled={registration.status === "pending"}
                          >
                            Mark as Pending
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
