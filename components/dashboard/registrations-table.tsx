"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowUp, Check, Download, Eye, Mail, Search, X } from "lucide-react"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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

type SortDirection = "asc" | "desc" | null
type SortField = "name" | "email" | "mobileNumber" | "designation" | "createdAt" | "status" | null

interface RegistrationsTableProps {
  eventId: string
  title?: string
  description?: string
}

export function RegistrationsTable({ eventId, title = "Registrations", description }: RegistrationsTableProps) {
  const router = useRouter()
  const [registrations, setRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [sendingEmail, setSendingEmail] = useState(false)

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
        setRegistrations(data)
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

    fetchRegistrations()
  }, [eventId])

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

      // Update local state
      setRegistrations(
        registrations.map((reg) => {
          if (selectedRegistrations.includes(reg._id)) {
            return { ...reg, status: "approved" }
          }
          return reg
        }),
      )

      setSelectedRegistrations([])
      toast({
        title: "Success",
        description: `${selectedRegistrations.length} registrations approved successfully.`,
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

      // Update local state
      setRegistrations(
        registrations.map((reg) => {
          if (reg._id === id) {
            return { ...reg, status }
          }
          return reg
        }),
      )

      toast({
        title: "Success",
        description: `Registration ${status} successfully.`,
      })
    } catch (error) {
      console.error("Error updating registration status:", error)
      toast({
        title: "Error",
        description: "Failed to update registration status. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle view registration
  const handleViewRegistration = (id: string) => {
    // Open a dialog or navigate to a details page
    router.push(`/event-dashboard/${eventId}/attendees/${id}`)
  }

  // Handle CSV export
  const handleExportCSV = () => {
    // Create CSV content
    const headers = ["Name", "Email", "Mobile Number", "Designation", "Registration Date", "Status"]

    const csvContent = [
      headers.join(","),
      ...filteredRegistrations.map((reg) => {
        const name = `${reg.firstName || ""} ${reg.lastName || ""}`.trim()
        const email = reg.email || ""
        const mobileNumber = reg.mobileNumber || reg.phoneNumber || reg.phone || ""
        const designation = reg.designation || reg.jobTitle || reg.role || ""
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
          body: emailBody,
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

  // Filter registrations based on search query
  const filteredRegistrations = registrations.filter((reg) => {
    const searchLower = searchQuery.toLowerCase()
    const name = `${reg.firstName || ""} ${reg.lastName || ""}`.toLowerCase()
    const email = (reg.email || "").toLowerCase()
    const phone = (reg.mobileNumber || reg.phoneNumber || reg.phone || "").toLowerCase()
    const designation = (reg.designation || reg.jobTitle || reg.role || "").toLowerCase()

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
        valueA = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase()
        valueB = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase()
        break
      case "email":
        valueA = (a.email || "").toLowerCase()
        valueB = (b.email || "").toLowerCase()
        break
      case "mobileNumber":
        valueA = (a.mobileNumber || a.phoneNumber || a.phone || "").toLowerCase()
        valueB = (b.mobileNumber || b.phoneNumber || b.phone || "").toLowerCase()
        break
      case "designation":
        valueA = (a.designation || a.jobTitle || a.role || "").toLowerCase()
        valueB = (b.designation || b.jobTitle || b.role || "").toLowerCase()
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

  return (
    <>
      <div className="space-y-4">
        {title && <h2 className="text-xl font-semibold">{title}</h2>}
        {description && <p className="text-muted-foreground">{description}</p>}

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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    Loading registrations...
                  </TableCell>
                </TableRow>
              ) : sortedRegistrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No registrations found.
                  </TableCell>
                </TableRow>
              ) : (
                sortedRegistrations.map((registration) => (
                  <TableRow key={registration._id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRegistrations.includes(registration._id)}
                        onCheckedChange={(checked) => handleSelectRegistration(registration._id, !!checked)}
                        aria-label={`Select ${registration.firstName} ${registration.lastName}`}
                      />
                    </TableCell>
                    <TableCell>
                      {registration.firstName} {registration.lastName}
                    </TableCell>
                    <TableCell>{registration.email}</TableCell>
                    <TableCell>
                      {registration.mobileNumber || registration.phoneNumber || registration.phone || "-"}
                    </TableCell>
                    <TableCell>
                      {registration.designation || registration.jobTitle || registration.role || "-"}
                    </TableCell>
                    <TableCell>
                      {registration.createdAt ? format(new Date(registration.createdAt), "MMM d, yyyy") : "-"}
                    </TableCell>
                    <TableCell>{renderStatusBadge(registration.status || "pending")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewRegistration(registration._id)}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleStatusChange(registration._id, "approved")}
                        >
                          <Check className="h-4 w-4" />
                          <span className="sr-only">Approve</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleStatusChange(registration._id, "rejected")}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Reject</span>
                        </Button>
                      </div>
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
