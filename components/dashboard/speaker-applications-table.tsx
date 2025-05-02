"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Eye, CheckCircle, XCircle, Search, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

interface SpeakerApplicationsTableProps {
  eventId: string
  title?: string
  description?: string
}

export function SpeakerApplicationsTable({
  eventId,
  title = "Speaker Applications",
  description = "Manage speaker applications for your event.",
}: SpeakerApplicationsTableProps) {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])

  // Helper functions to extract data from dynamic field names
  // Update the helper functions to match the exact field names in the API response

  // Replace the getName function with this:
  const getName = (application: any) => {
    if (!application?.data) return "N/A"

    // Check for the specific name field from the response
    if (application.data.question_name_1746037078730) {
      return application.data.question_name_1746037078730
    }

    // Check for any field containing "name_"
    for (const key in application.data) {
      if (key.includes("question_name_") && !key.includes("meetup") && !key.includes("organizer")) {
        return application.data[key] || "N/A"
      }
    }

    // Fallback to userName or name in data
    return application.userName || application.data.name || "N/A"
  }

  // Replace the getEmail function with this:
  const getEmail = (application: any) => {
    if (!application?.data) return "N/A"

    // Check for the specific email field from the response
    if (application.data.question_email_1746037078731) {
      return application.data.question_email_1746037078731
    }

    // Check for any field containing "email_" but not "corporate"
    for (const key in application.data) {
      if (key.includes("question_email_") && !key.includes("corporate")) {
        return application.data[key] || "N/A"
      }
    }

    // Fallback to userEmail or email in data
    return application.userEmail || application.data.email || "N/A"
  }

  // Replace the getCorporateEmail function with this:
  const getCorporateEmail = (application: any) => {
    if (!application?.data) return "N/A"

    // Check for the specific corporate email field from the response
    if (application.data.question_corporateEmail_1746037078732) {
      return application.data.question_corporateEmail_1746037078732
    }

    // Check for any field containing "corporateEmail_"
    for (const key in application.data) {
      if (key.includes("question_corporateEmail_")) {
        return application.data[key] || "N/A"
      }
    }

    return "N/A"
  }

  // Replace the getDesignation function with this:
  const getDesignation = (application: any) => {
    if (!application?.data) return "N/A"

    // Check for the specific designation field from the response
    if (application.data.question_designation_1746037078733) {
      return application.data.question_designation_1746037078733
    }

    // Check for any field containing "designation_"
    for (const key in application.data) {
      if (key.includes("question_designation_")) {
        return application.data[key] || "N/A"
      }
    }

    return "N/A"
  }

  // Replace the getEventOrganizer function with this:
  const getEventOrganizer = (application: any) => {
    if (!application?.data) return "N/A"

    // Check for the specific event organizer field from the response
    if (application.data.question_eventOrganizer_1746037078734) {
      return application.data.question_eventOrganizer_1746037078734
    }

    // Check for any field containing "eventOrganizer_"
    for (const key in application.data) {
      if (key.includes("question_eventOrganizer_")) {
        return application.data[key] || "N/A"
      }
    }

    return "N/A"
  }

  // Replace the getIsMvp function with this:
  const getIsMvp = (application: any) => {
    if (!application?.data) return "No"

    // Check for the specific MVP field from the response
    if (application.data.question_isMicrosoftMVP_1746037078735 !== undefined) {
      return application.data.question_isMicrosoftMVP_1746037078735 ? "Yes" : "No"
    }

    // Check for any field containing "isMicrosoftMVP_" or "isMvp_"
    for (const key in application.data) {
      if (key.includes("question_isMicrosoftMVP_") || key.includes("question_isMvp_")) {
        return application.data[key] ? "Yes" : "No"
      }
    }

    return "No"
  }

  // Replace the getMvpId function with this:
  const getMvpId = (application: any) => {
    if (!application?.data) return "N/A"

    // Check for the specific MVP ID field from the response
    if (application.data.question_mvpId_1746037078736) {
      return application.data.question_mvpId_1746037078736
    }

    // Check for any field containing "mvpId_"
    for (const key in application.data) {
      if (key.includes("question_mvpId_")) {
        return application.data[key] || "N/A"
      }
    }

    return "N/A"
  }

  // Replace the getMvpProfileLink function with this:
  const getMvpProfileLink = (application: any) => {
    if (!application?.data) return "N/A"

    // Check for the specific MVP profile link field from the response
    if (application.data.question_mvpProfileLink_1746037078737) {
      return application.data.question_mvpProfileLink_1746037078737
    }

    // Check for any field containing "mvpProfileLink_"
    for (const key in application.data) {
      if (key.includes("question_mvpProfileLink_")) {
        return application.data[key] || "N/A"
      }
    }

    return "N/A"
  }

  // Replace the getMvpCategory function with this:
  const getMvpCategory = (application: any) => {
    if (!application?.data) return "N/A"

    // Check for the specific MVP category field from the response
    if (application.data.question_mvpCategory_1746037078738) {
      return application.data.question_mvpCategory_1746037078738
    }

    // Check for any field containing "mvpCategory_"
    for (const key in application.data) {
      if (key.includes("question_mvpCategory_")) {
        return application.data[key] || "N/A"
      }
    }

    return "N/A"
  }

  // Replace the getRunningMeetupGroup function with this:
  const getRunningMeetupGroup = (application: any) => {
    if (!application?.data) return "No"

    // Check for the specific running meetup group field from the response
    if (application.data.question_areYouRunningMeetupGroup_1746037078739 !== undefined) {
      return application.data.question_areYouRunningMeetupGroup_1746037078739 ? "Yes" : "No"
    }

    // Check for any field containing "areYouRunningMeetupGroup_" or "runningMeetupGroup_"
    for (const key in application.data) {
      if (key.includes("question_areYouRunningMeetupGroup_") || key.includes("question_runningMeetupGroup_")) {
        return application.data[key] ? "Yes" : "No"
      }
    }

    return "No"
  }

  // Replace the getMeetupName function with this:
  const getMeetupName = (application: any) => {
    if (!application?.data) return "N/A"

    // Check for the specific meetup name field from the response
    if (application.data.question_meetupEventName_1746037078740) {
      return application.data.question_meetupEventName_1746037078740
    }

    // Check for any field containing "meetupEventName_" or "meetupName_"
    for (const key in application.data) {
      if (key.includes("question_meetupEventName_") || key.includes("question_meetupName_")) {
        return application.data[key] || "N/A"
      }
    }

    return "N/A"
  }

  // Replace the getEventDetails function with this:
  const getEventDetails = (application: any) => {
    if (!application?.data) return "N/A"

    // Check for the specific event details field from the response
    if (application.data.question_eventDetails_1746037078741) {
      return application.data.question_eventDetails_1746037078741
    }

    // Check for any field containing "eventDetails_"
    for (const key in application.data) {
      if (key.includes("question_eventDetails_")) {
        return application.data[key] || "N/A"
      }
    }

    return "N/A"
  }

  // Replace the getMeetupPageDetails function with this:
  const getMeetupPageDetails = (application: any) => {
    if (!application?.data) return "N/A"

    // Check for the specific meetup page details field from the response
    if (application.data.question_meetupPageDetails_1746037078742) {
      return application.data.question_meetupPageDetails_1746037078742
    }

    // Check for any field containing "meetupPageDetails_"
    for (const key in application.data) {
      if (key.includes("question_meetupPageDetails_")) {
        return application.data[key] || "N/A"
      }
    }

    return "N/A"
  }

  // Replace the getLinkedIn function with this:
  const getLinkedIn = (application: any) => {
    if (!application?.data) return "N/A"

    // Check for the specific LinkedIn field from the response
    if (application.data.question_linkedinId_1746037078743) {
      return application.data.question_linkedinId_1746037078743
    }

    // Check for any field containing "linkedinId_"
    for (const key in application.data) {
      if (key.includes("question_linkedinId_")) {
        return application.data[key] || "N/A"
      }
    }

    return "N/A"
  }

  // Replace the getGitHub function with this:
  const getGitHub = (application: any) => {
    if (!application?.data) return "N/A"

    // Check for the specific GitHub field from the response
    if (application.data.question_githubId_1746037078744) {
      return application.data.question_githubId_1746037078744
    }

    // Check for any field containing "githubId_"
    for (const key in application.data) {
      if (key.includes("question_githubId_")) {
        return application.data[key] || "N/A"
      }
    }

    return "N/A"
  }

  // Replace the getOtherSocialMedia function with this:
  const getOtherSocialMedia = (application: any) => {
    if (!application?.data) return "N/A"

    // Check for the specific other social media field from the response
    if (application.data.question_otherSocialMediaId_1746037078745 !== undefined) {
      return application.data.question_otherSocialMediaId_1746037078745 || "N/A"
    }

    // Check for any field containing "otherSocialMediaId_"
    for (const key in application.data) {
      if (key.includes("question_otherSocialMediaId_")) {
        return application.data[key] || "N/A"
      }
    }

    return "N/A"
  }

  // Replace the getMobileNumber function with this:
  const getMobileNumber = (application: any) => {
    if (!application?.data) return "N/A"

    // Check for any field containing "mobileNumber_" or "phoneNumber_"
    for (const key in application.data) {
      if (key.includes("question_mobileNumber_") || key.includes("question_phoneNumber_")) {
        return application.data[key] || "N/A"
      }
    }

    return "N/A"
  }

  // Replace the getTalkTitle function with this:
  const getTalkTitle = (application: any) => {
    if (!application?.data) return "N/A"

    // Check for any field containing "talkTitle_", "sessionTitle_", or "presentationTitle_"
    for (const key in application.data) {
      if (
        key.includes("question_talkTitle_") ||
        key.includes("question_sessionTitle_") ||
        key.includes("question_presentationTitle_")
      ) {
        return application.data[key] || "N/A"
      }
    }

    return "N/A"
  }

  // Replace the getTalkDescription function with this:
  const getTalkDescription = (application: any) => {
    if (!application?.data) return "N/A"

    // Check for any field containing "talkDescription_", "sessionDescription_", or "presentationDescription_"
    for (const key in application.data) {
      if (
        key.includes("question_talkDescription_") ||
        key.includes("question_sessionDescription_") ||
        key.includes("question_presentationDescription_")
      ) {
        return application.data[key] || "N/A"
      }
    }

    return "N/A"
  }

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/events/${eventId}/speaker-applications`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch speaker applications (Status: ${response.status})`)
        }

        const data = await response.json()
        console.log("Speaker applications data:", data)
        setApplications(data.submissions || [])
      } catch (error) {
        console.error("Error fetching speaker applications:", error)
        setError(error instanceof Error ? error.message : "Failed to load speaker applications")
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load speaker applications",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [eventId, toast])

  const handleViewApplication = (application: any) => {
    setSelectedApplication(application)
    setDialogOpen(true)
  }

  const handleUpdateStatus = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/submissions/speaker/${applicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update application status")
      }

      // Update the application in the local state
      setApplications(applications.map((app) => (app._id === applicationId ? { ...app, status: newStatus } : app)))

      toast({
        title: "Status Updated",
        description: `Application status updated to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating application status:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update application status",
        variant: "destructive",
      })
    }
  }

  const handleBulkApprove = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/submissions/speaker/bulk-approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ submissionIds: selectedApplications }),
      })

      if (!response.ok) {
        throw new Error("Failed to bulk approve applications")
      }

      // Update the applications in the local state
      setApplications(
        applications.map((app) => (selectedApplications.includes(app._id) ? { ...app, status: "approved" } : app)),
      )
      setSelectedApplications([])

      toast({
        title: "Applications Approved",
        description: `${selectedApplications.length} applications approved successfully.`,
      })
    } catch (error) {
      console.error("Error bulk approving applications:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to bulk approve applications",
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

  const toggleApplication = (applicationId: string) => {
    setSelectedApplications((prev) => {
      if (prev.includes(applicationId)) {
        return prev.filter((id) => id !== applicationId)
      } else {
        return [...prev, applicationId]
      }
    })
  }

  const allSelected = applications.length > 0 && selectedApplications.length === applications.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedApplications([])
    } else {
      setSelectedApplications(applications.map((app) => app._id))
    }
  }

  const filteredApplications = applications.filter((app) => {
    if (!searchQuery) return true

    const name = getName(app).toLowerCase()
    const email = getEmail(app).toLowerCase()
    const talkTitle = getTalkTitle(app).toLowerCase()
    const query = searchQuery.toLowerCase()

    return name.includes(query) || email.includes(query) || talkTitle.includes(query)
  })

  const exportToCSV = () => {
    // Create CSV header
    const headers = [
      "Name",
      "Email",
      "Corporate Email",
      "Designation",
      "Event Organizer",
      "Is MVP",
      "MVP ID",
      "MVP Profile Link",
      "MVP Category",
      "Running Meetup Group",
      "Meetup Name",
      "Event Details",
      "Meetup Page Details",
      "LinkedIn",
      "GitHub",
      "Other Social Media",
      "Mobile Number",
      "Talk Title",
      "Talk Description",
      "Status",
      "Submitted Date",
    ]

    // Create CSV rows
    const rows = filteredApplications.map((app) => [
      getName(app),
      getEmail(app),
      getCorporateEmail(app),
      getDesignation(app),
      getEventOrganizer(app),
      getIsMvp(app),
      getMvpId(app),
      getMvpProfileLink(app),
      getMvpCategory(app),
      getRunningMeetupGroup(app),
      getMeetupName(app),
      getEventDetails(app),
      getMeetupPageDetails(app),
      getLinkedIn(app),
      getGitHub(app),
      getOtherSocialMedia(app),
      getMobileNumber(app),
      getTalkTitle(app),
      getTalkDescription(app),
      app.status,
      new Date(app.createdAt).toLocaleString(),
    ])

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n")

    // Create a blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `speaker-applications-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading speaker applications...</span>
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
          <Button variant="outline" onClick={handleBulkApprove} disabled={selectedApplications.length === 0}>
            <CheckCircle className="h-4 w-4 mr-1" />
            Bulk Approve ({selectedApplications.length})
          </Button>

          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-1" />
            Export to CSV
          </Button>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email or talk title..."
              className="pl-8 max-w-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredApplications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No speaker applications found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-white z-10">
                    <Checkbox checked={allSelected} onCheckedChange={() => toggleSelectAll()} aria-label="Select all" />
                  </TableHead>
                  <TableHead className="sticky left-[40px] bg-white z-10">Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Corporate Email</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Event Organizer</TableHead>
                  <TableHead>Is MVP</TableHead>
                  <TableHead>MVP ID</TableHead>
                  <TableHead>MVP Profile Link</TableHead>
                  <TableHead>MVP Category</TableHead>
                  <TableHead>Running Meetup Group</TableHead>
                  <TableHead>Meetup Name</TableHead>
                  <TableHead>Event Details</TableHead>
                  <TableHead>Meetup Page Details</TableHead>
                  <TableHead>LinkedIn</TableHead>
                  <TableHead>GitHub</TableHead>
                  <TableHead>Other Social Media</TableHead>
                  <TableHead>Mobile Number</TableHead>
                  <TableHead>Talk Title</TableHead>
                  <TableHead>Talk Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="sticky right-0 bg-white z-10">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={application._id}>
                    <TableCell className="sticky left-0 bg-white z-10">
                      <Checkbox
                        checked={selectedApplications.includes(application._id)}
                        onCheckedChange={() => toggleApplication(application._id)}
                        aria-label="Select row"
                      />
                    </TableCell>
                    <TableCell className="sticky left-[40px] bg-white z-10 font-medium">
                      {getName(application)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{getEmail(application)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{getCorporateEmail(application)}</TableCell>
                    <TableCell>{getDesignation(application)}</TableCell>
                    <TableCell>{getEventOrganizer(application)}</TableCell>
                    <TableCell>{getIsMvp(application)}</TableCell>
                    <TableCell>{getMvpId(application)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{getMvpProfileLink(application)}</TableCell>
                    <TableCell>{getMvpCategory(application)}</TableCell>
                    <TableCell>{getRunningMeetupGroup(application)}</TableCell>
                    <TableCell>{getMeetupName(application)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{getEventDetails(application)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{getMeetupPageDetails(application)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{getLinkedIn(application)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{getGitHub(application)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{getOtherSocialMedia(application)}</TableCell>
                    <TableCell>{getMobileNumber(application)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{getTalkTitle(application)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{getTalkDescription(application)}</TableCell>
                    <TableCell>{getStatusBadge(application.status)}</TableCell>
                    <TableCell>{formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })}</TableCell>
                    <TableCell className="sticky right-0 bg-white z-10">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewApplication(application)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {application.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleUpdateStatus(application._id, "approved")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleUpdateStatus(application._id, "rejected")}
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

      {/* Application Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Speaker Application Details</DialogTitle>
            <DialogDescription>
              Submitted{" "}
              {selectedApplication &&
                selectedApplication.createdAt &&
                formatDistanceToNow(new Date(selectedApplication.createdAt), { addSuffix: true })}
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                  <p>{getName(selectedApplication)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                  <p>{getEmail(selectedApplication)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <p>{getStatusBadge(selectedApplication.status)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Submission ID</h3>
                  <p className="text-xs">{selectedApplication._id}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Form Responses</h3>
                <div className="space-y-3">
                  {selectedApplication.data &&
                    Object.entries(selectedApplication.data).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-3 gap-2">
                        <div className="font-medium text-sm">{formatFieldName(key)}</div>
                        <div className="col-span-2">{String(value)}</div>
                      </div>
                    ))}
                </div>
              </div>

              {selectedApplication.status === "pending" && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="text-green-600 hover:text-green-700"
                    onClick={() => {
                      handleUpdateStatus(selectedApplication._id, "approved")
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
                      handleUpdateStatus(selectedApplication._id, "rejected")
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
