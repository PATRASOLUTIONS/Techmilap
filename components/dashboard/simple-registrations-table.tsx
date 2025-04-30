"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ArrowDown, ArrowUp, Check, Download, Filter, Mail, MoreHorizontal, Search, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

type SortDirection = "asc" | "desc" | null
type SortField = "name" | "email" | "mobileNumber" | "designation" | "createdAt" | "status" | null

interface SimpleRegistrationsTableProps {
  registrations: any[]
  eventId: string
}

export function SimpleRegistrationsTable({ registrations, eventId }: SimpleRegistrationsTableProps) {
  const router = useRouter()
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [sendingEmail, setSendingEmail] = useState(false)

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRegistrations(filteredRegistrations.map((reg) => reg._id))
    } else {
      setSelectedRegistrations([])
    }
  }

  // Handle individual selection
  const handleSelectRegistration = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRegistrations([...selectedRegistrations, id])
    } else {
      setSelectedRegistrations(selectedRegistrations.filter((regId) => regId !== id))
    }
  }

  // Handle bulk approval
  const handleBulkApprove = async () => {
    if (selectedRegistrations.length === 0) return

    try {
      const response = await fetch(`/api/events/${eventId}/registrations/bulk-approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ registrationIds: selectedRegistrations }),
      })

      if (!response.ok) {
        throw new Error("Failed to approve registrations")
      }

      toast({
        title: "Success",
        description: `${selectedRegistrations.length} registrations approved successfully.`,
      })

      // Refresh the page to show updated data
      router.refresh()
      setSelectedRegistrations([])
    } catch (error) {
      console.error("Error approving registrations:", error)
      toast({
        title: "Error",
        description: "Failed to approve registrations. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle status change
  const handleStatusChange = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/registrations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error("Failed to update registration status")
      }

      toast({
        title: "Success",
        description: `Registration ${status} successfully.`,
      })

      // Refresh the page to show updated data
      router.refresh()
    } catch (error) {
      console.error("Error updating registration status:", error)
      toast({
        title: "Error",
        description: "Failed to update registration status. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle CSV export
  const handleExportCSV = () => {
    // Create CSV content
    const headers = ["Name", "Email", "Mobile Number", "Designation", "Registration Date", "Status"]

    const csvContent = [
      headers.join(","),
      ...filteredRegistrations.map((reg) => {
        const name = getAttendeeName(reg)
        const email = getAttendeeEmail(reg)
        const mobileNumber = getAttendeeMobile(reg)
        const designation = getAttendeeDesignation(reg)
        const date = reg.createdAt ? format(new Date(reg.createdAt), "yyyy-MM-dd") : ""
        const status = reg.status || "pending"

        return [name, email, mobileNumber, designation, date, status].join(",")
      }),
    ].join("\n")

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `registrations-${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Handle email sending
  const handleSendEmail = async () => {
    if (selectedRegistrations.length === 0 || !emailSubject || !emailBody) return

    try {
      setSendingEmail(true)
      const response = await fetch(`/api/events/${eventId}/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registrationIds: selectedRegistrations,
          subject: emailSubject,
          message: emailBody,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send emails")
      }

      setEmailDialogOpen(false)
      setEmailSubject("")
      setEmailBody("")
      setSelectedRegistrations([])

      toast({
        title: "Success",
        description: `Emails sent to ${selectedRegistrations.length} recipients.`,
      })
    } catch (error) {
      console.error("Error sending emails:", error)
      toast({
        title: "Error",
        description: "Failed to send emails. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSendingEmail(false)
    }
  }

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction or clear if already desc
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortField(null)
        setSortDirection(null)
      }
    } else {
      // New field, start with asc
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Helper functions to extract data
  const getAttendeeName = (registration: any) => {
    if (!registration) return "N/A"

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
    return registration.userName || registration.name || "Anonymous"
  }

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

  // Filter registrations based on search query
  const filteredRegistrations = registrations.filter((reg) => {
    if (!searchQuery) return true

    const searchLower = searchQuery.toLowerCase()
    const name = getAttendeeName(reg).toLowerCase()
    const email = getAttendeeEmail(reg).toLowerCase()
    const phone = getAttendeeMobile(reg).toLowerCase()
    const designation = getAttendeeDesignation(reg).toLowerCase()

    return (
      name.includes(searchLower) ||
      email.includes(searchLower) ||
      phone.includes(searchLower) ||
      designation.includes(searchLower)
    )
  })

  // Sort registrations
  const sortedRegistrations = [...filteredRegistrations].sort((a, b) => {
    if (!sortField || !sortDirection) return 0

    let valueA, valueB

    switch (sortField) {
      case "name":
        valueA = getAttendeeName(a).toLowerCase()
        valueB = getAttendeeName(b).toLowerCase()
        break
      case "email":
        valueA = getAttendeeEmail(a).toLowerCase()
        valueB = getAttendeeEmail(b).toLowerCase()
        break
      case "mobileNumber":
        valueA = getAttendeeMobile(a).toLowerCase()
        valueB = getAttendeeMobile(b).toLowerCase()
        break
      case "designation":
        valueA = getAttendeeDesignation(a).toLowerCase()
        valueB = getAttendeeDesignation(b).toLowerCase()
        break
      case "createdAt":
        valueA = new Date(a.createdAt || 0).getTime()
        valueB = new Date(b.createdAt || 0).getTime()
        break
      case "status":
        valueA = (a.status || "").toLowerCase()
        valueB = (b.status || "").toLowerCase()
        break
      default:
        return 0
    }

    if (sortDirection === "asc") {
      return valueA > valueB ? 1 : -1
    } else {
      return valueA < valueB ? 1 : -1
    }
  })

  // Render sort indicator
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null

    return sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
  }

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Rejected</Badge>
      case "waitlist":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Waitlist</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Pending</Badge>
    }
  }

  if (registrations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          <p>There are no registrations for this event yet.</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => router.push(`/event-dashboard/${eventId}`)}>
            Back to Event Dashboard
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search registrations..."
              className="pl-8 w-full sm:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {selectedRegistrations.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={() => setEmailDialogOpen(true)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email ({selectedRegistrations.length})
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkApprove}>
                  <Check className="mr-2 h-4 w-4" />
                  Approve ({selectedRegistrations.length})
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      filteredRegistrations.length > 0 && selectedRegistrations.length === filteredRegistrations.length
                    }
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                  <div className="flex items-center">
                    Name
                    {renderSortIndicator("name")}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("email")}>
                  <div className="flex items-center">
                    Email
                    {renderSortIndicator("email")}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("mobileNumber")}>
                  <div className="flex items-center">
                    Mobile Number
                    {renderSortIndicator("mobileNumber")}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("designation")}>
                  <div className="flex items-center">
                    Designation
                    {renderSortIndicator("designation")}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("createdAt")}>
                  <div className="flex items-center">
                    Registered
                    {renderSortIndicator("createdAt")}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                  <div className="flex items-center">
                    Status
                    {renderSortIndicator("status")}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRegistrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No registrations found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                sortedRegistrations.map((registration) => (
                  <TableRow key={registration._id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRegistrations.includes(registration._id)}
                        onCheckedChange={(checked) => handleSelectRegistration(registration._id, !!checked)}
                        aria-label={`Select ${getAttendeeName(registration)}`}
                      />
                    </TableCell>
                    <TableCell>{getAttendeeName(registration)}</TableCell>
                    <TableCell>{getAttendeeEmail(registration)}</TableCell>
                    <TableCell>{getAttendeeMobile(registration)}</TableCell>
                    <TableCell>{getAttendeeDesignation(registration)}</TableCell>
                    <TableCell>
                      {registration.createdAt ? format(new Date(registration.createdAt), "MMM d, yyyy") : "-"}
                    </TableCell>
                    <TableCell>{renderStatusBadge(registration.status || "pending")}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleStatusChange(registration._id, "approved")}>
                            <Check className="mr-2 h-4 w-4" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(registration._id, "rejected")}>
                            <X className="mr-2 h-4 w-4" />
                            Reject
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(registration._id, "waitlist")}>
                            <Filter className="mr-2 h-4 w-4" />
                            Move to Waitlist
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Send Email to Selected Attendees</DialogTitle>
            <DialogDescription>Send an email to {selectedRegistrations.length} selected attendees.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="subject">Subject</label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="body">Message</label>
              <Textarea
                id="body"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Write your message here..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={sendingEmail || !emailSubject || !emailBody}>
              {sendingEmail ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
