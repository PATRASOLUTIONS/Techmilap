"use client"

import { useState, useEffect, useMemo } from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getSortedRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2, Eye, CheckCircle, XCircle, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface RegistrationsTableProps {
  eventId: string
  title: string
  description: string
}

export function RegistrationsTable({ eventId, title, description }: RegistrationsTableProps) {
  const [registrations, setRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([])
  const [customQuestions, setCustomQuestions] = useState<any[]>([])
  const [eventDetails, setEventDetails] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [questionFilters, setQuestionFilters] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!eventId) {
        setLoading(false)
        setError("Event ID is missing")
        return
      }

      try {
        setLoading(true)
        console.log(`Fetching registrations for event: ${eventId}`)

        // Fetch event details to use in email notifications
        const eventResponse = await fetch(`/api/events/${eventId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        })

        if (eventResponse.ok) {
          const eventData = await eventResponse.json()
          setEventDetails(eventData.event)
        } else {
          console.error("Failed to fetch event details")
        }

        // Use the correct API endpoint for attendee registrations
        const response = await fetch(`/api/events/${eventId}/registrations`, {
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
        console.log("Registrations data:", data)

        if (!data.registrations) {
          console.warn("No registrations array in response:", data)
          setRegistrations([])
        } else {
          setRegistrations(data.registrations)
        }
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

    fetchSubmissions()
    fetchCustomQuestions()
  }, [eventId, toast])

  const handleViewSubmission = (submission: any) => {
    setSelectedRegistration(submission)
    setDialogOpen(true)
  }

  const handleUpdateStatus = async (submissionId: string, newStatus: string) => {
    try {
      console.log(`Updating submission ${submissionId} to status ${newStatus}`)
      const response = await fetch(`/api/events/${eventId}/registrations/${submissionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update submission status")
      }

      // Find the submission that was updated
      const updatedSubmission = registrations.find((sub: any) => sub.id === submissionId)

      // Update the submission in the local state
      setRegistrations(registrations.map((sub: any) => (sub.id === submissionId ? { ...sub, status: newStatus } : sub)))

      // Send email notification if the submission was found and we have event details
      if (updatedSubmission && eventDetails) {
        // Prepare notification data
        const notificationData = {
          eventName: eventDetails.name,
          eventDate: new Date(eventDetails.startDate).toLocaleDateString(),
          eventLocation: eventDetails.location,
          recipientEmail: updatedSubmission.email,
          recipientName: updatedSubmission.name || "Attendee",
          eventId: eventId,
          eventSlug: eventDetails.slug,
          organizerName: eventDetails.organizerName || "Event Organizer",
          organizerEmail: eventDetails.organizerEmail || "noreply@example.com",
          additionalInfo:
            newStatus === "approved"
              ? "We're excited to have you join us! More details will be sent closer to the event date."
              : "We appreciate your interest in our event. Unfortunately, we cannot accommodate your registration at this time.",
        }

        // Send the appropriate notification based on status
        if (newStatus === "approved") {
          await fetch("/api/events/send-notification", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "attendee-approval",
              data: notificationData,
            }),
          })
        } else if (newStatus === "rejected") {
          await fetch("/api/events/send-notification", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "attendee-rejection",
              data: notificationData,
            }),
          })
        }
      }

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
      const response = await fetch(`/api/events/${eventId}/submissions/attendee/bulk-approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ submissionIds: selectedSubmissions }),
      })

      if (!response.ok) {
        throw new Error("Failed to bulk approve submissions")
      }

      // Update the submission in the local state
      setRegistrations(
        registrations.map((sub: any) => (selectedSubmissions.includes(sub.id) ? { ...sub, status: "approved" } : sub)),
      )

      // Send email notifications for all approved submissions
      if (eventDetails) {
        const approvedSubmissions = registrations.filter((sub: any) => selectedSubmissions.includes(sub.id))

        for (const submission of approvedSubmissions) {
          const notificationData = {
            eventName: eventDetails.name,
            eventDate: new Date(eventDetails.startDate).toLocaleDateString(),
            eventLocation: eventDetails.location,
            recipientEmail: submission.email,
            recipientName: submission.name || "Attendee",
            eventId: eventId,
            eventSlug: eventDetails.slug,
            organizerName: eventDetails.organizerName || "Event Organizer",
            organizerEmail: eventDetails.organizerEmail || "noreply@example.com",
            additionalInfo: "We're excited to have you join us! More details will be sent closer to the event date.",
          }

          await fetch("/api/events/send-notification", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "attendee-approval",
              data: notificationData,
            }),
          })
        }
      }

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
        return (
          <Badge variant="outline" className="bg-green-500 text-white border-green-500">
            Approved
          </Badge>
        )
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

  const allSelected = registrations.length > 0 && selectedSubmissions.length === registrations.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedSubmissions([])
    } else {
      setSelectedSubmissions(registrations.map((sub: any) => sub.id))
    }
  }

  const handleQuestionFilterChange = (questionId: string, value: string) => {
    setQuestionFilters((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((registration: any) => {
      // Filter by search term
      if (
        searchTerm &&
        !registration.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !registration.email?.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false
      }

      // Filter by status
      if (statusFilter !== "all" && registration.status !== statusFilter) {
        return false
      }

      // Filter by custom question answers
      for (const [questionId, filterValue] of Object.entries(questionFilters)) {
        if (filterValue && registration.data[`custom_${questionId}`] !== filterValue) {
          return false
        }
      }

      return true
    })
  }, [registrations, searchTerm, statusFilter, questionFilters])

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox checked={allSelected} onCheckedChange={() => toggleSelectAll()} aria-label="Select all" />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedSubmissions.includes(row.original.id)}
            onCheckedChange={() => toggleSubmission(row.original.id)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => <div>{row.original.name || "Anonymous"}</div>,
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => <div>{row.original.email || "N/A"}</div>,
      },
      ...customQuestions.map((question) => ({
        accessorKey: `data.custom_${question.id}`,
        header: formatFieldName(question.label),
        cell: ({ row }) => <div>{row.original.data[`custom_${question.id}`] || "N/A"}</div>,
        filterFn: (row, id, value) => {
          return value.length === 0 || row.getValue(id).toLowerCase().includes(value.toLowerCase())
        },
      })),
      {
        accessorKey: "registeredAt",
        header: "Registered",
        cell: ({ row }) => (
          <div>
            {row.registeredAt ? formatDistanceToNow(new Date(row.registeredAt), { addSuffix: true }) : "Unknown"}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <div>{getStatusBadge(row.status)}</div>,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const submission = row.original
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewSubmission(submission)}
                className="flex items-center"
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              {submission.status === "pending" && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600 hover:text-green-700 flex items-center"
                    onClick={() => {
                      console.log(`Approve button clicked for submission ID: ${submission.id}`)
                      handleUpdateStatus(submission.id, "approved")
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 flex items-center"
                    onClick={() => handleUpdateStatus(submission.id, "rejected")}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </>
              )}
            </div>
          )
        },
      },
    ],
    [customQuestions, selectedSubmissions],
  )

  const table = useReactTable({
    data: filteredRegistrations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      columnVisibility: {
        "data.name": true,
        "data.email": true,
      },
      pagination: {
        pageSize: 10,
      },
    },
  })

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
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleBulkApprove} disabled={selectedSubmissions.length === 0}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Bulk Approve
            </Button>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 max-w-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {customQuestions
            .filter((q) => q.type === "select" || q.type === "radio")
            .map((question) => (
              <DropdownMenu key={question.id}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {formatFieldName(question.label)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleQuestionFilterChange(question.id, "")}>All</DropdownMenuItem>
                  {question.options?.map((option: string) => (
                    <DropdownMenuItem key={option} onClick={() => handleQuestionFilterChange(question.id, option)}>
                      {option}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ))}
        </div>
      </CardHeader>
      <CardContent>
        {registrations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No registrations yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
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
              {selectedRegistration &&
                selectedRegistration.registeredAt &&
                formatDistanceToNow(new Date(selectedRegistration.registeredAt), { addSuffix: true })}
            </DialogDescription>
          </DialogHeader>

          {selectedRegistration && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                  <p>{selectedRegistration.name || "Anonymous"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                  <p>{selectedRegistration.email || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <p>{getStatusBadge(selectedRegistration.status)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Registration ID</h3>
                  <p className="text-xs">{selectedRegistration.id}</p>
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
                    variant="ghost"
                    className="text-green-600 hover:text-green-700 flex items-center"
                    onClick={() => {
                      handleUpdateStatus(selectedRegistration.id, "approved")
                      setDialogOpen(false)
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 flex items-center"
                    onClick={() => {
                      handleUpdateStatus(selectedRegistration.id, "rejected")
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
      <CardFooter className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            filteredRegistrations.length,
          )}{" "}
          of {filteredRegistrations.length} entries
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
