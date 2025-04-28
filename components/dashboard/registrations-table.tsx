"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Eye, CheckCircle, XCircle, Download, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { registrationsToCSV, downloadCSV } from "@/lib/csv-export"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { AdvancedFilter } from "./advanced-filter"

interface RegistrationsTableProps {
  eventId: string
  title: string
  description: string
  filterStatus?: "pending" | "approved" | "rejected"
}

interface FilterState {
  [key: string]: string | boolean | null | number[] | Date | { min: number; max: number } | string[]
}

export function RegistrationsTable({ eventId, title, description, filterStatus }: RegistrationsTableProps) {
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([])
  const [filters, setFilters] = useState<FilterState>({})
  const [totalCount, setTotalCount] = useState(0)
  const [filteredCount, setFilteredCount] = useState(0)

  // Email dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailMessage, setEmailMessage] = useState("")
  const [includeEventDetails, setIncludeEventDetails] = useState(true)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [selectedAttendees, setSelectedAttendees] = useState<any[]>([])

  useEffect(() => {
    fetchRegistrations()
  }, [eventId, filterStatus, filters])

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

      // Add custom filters to the query
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          if (key === "search") {
            params.append("search", String(value))
          } else if (key === "registrationDate" && typeof value === "object" && "from" in value) {
            const from = (value as any).from?.toISOString().split("T")[0]
            const to = (value as any).to?.toISOString().split("T")[0] || from
            params.append(`filter_registrationDate`, `date_range:${from}:${to}`)
          } else if (typeof value === "object" && "min" in value && "max" in value) {
            // Handle numeric range filters
            params.append(`filter_${key}`, `range:${(value as any).min}-${(value as any).max}`)
          } else if (value instanceof Date) {
            // Handle date filters
            params.append(`filter_${key}`, `date:${value.toISOString().split("T")[0]}`)
          } else if (Array.isArray(value)) {
            // Handle array values (multi-select)
            params.append(`filter_${key}`, `in:${value.join(",")}`)
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
      setTotalCount(data.totalCount || 0)
      setFilteredCount(data.registrations?.length || 0)
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

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
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

  // Export to CSV function
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
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-6">
          <AdvancedFilter eventId={eventId} onFilterChange={handleFilterChange} initialFilters={filters} />
        </div>

        {filteredCount > 0 && totalCount > 0 && filteredCount < totalCount && (
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredCount} of {totalCount} total registrations
          </div>
        )}

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
