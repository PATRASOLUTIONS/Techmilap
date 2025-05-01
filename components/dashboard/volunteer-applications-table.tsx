"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Eye, CheckCircle, XCircle, Search, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface VolunteerApplicationsTableProps {
  eventId: string
  title: string
  description: string
}

export function VolunteerApplicationsTable({ eventId, title, description }: VolunteerApplicationsTableProps) {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true)
        setError(null)

        // Use the correct API endpoint
        let url = `/api/events/${eventId}/submissions/volunteer`
        if (searchQuery) {
          url += `?search=${encodeURIComponent(searchQuery)}`
        }

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`Failed to fetch volunteer submissions (Status: ${response.status})`)
        }

        const data = await response.json()
        console.log("Volunteer submissions data:", data)

        if (data.submissions) {
          setSubmissions(data.submissions)
        } else {
          setSubmissions([])
        }
      } catch (error) {
        console.error("Error fetching volunteer submissions:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to load volunteer submissions"
        setError(errorMessage)

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissions()
  }, [eventId, searchQuery, toast])

  // Helper function to get value from dynamic field names
  const getFieldValue = (submission: any, fieldPrefix: string, defaultValue = "N/A") => {
    if (!submission || !submission.data) return defaultValue

    // Look for fields that start with the prefix in the data object
    for (const key of Object.keys(submission.data)) {
      if (key.startsWith(fieldPrefix)) {
        const value = submission.data[key]
        if (value !== undefined && value !== null && value !== "") {
          return value
        }
      }
    }

    // Also check for exact field names
    if (fieldPrefix === "name" && submission.data.name) return submission.data.name
    if (fieldPrefix === "email" && submission.data.email) return submission.data.email

    // Check for userName and userEmail at the submission level
    if (fieldPrefix === "name" && submission.userName) return submission.userName
    if (fieldPrefix === "email" && submission.userEmail) return submission.userEmail

    return defaultValue
  }

  // Helper functions for each field
  const getName = (submission: any) => {
    return getFieldValue(submission, "question_name_", submission.userName || "Anonymous")
  }

  const getEmail = (submission: any) => {
    return getFieldValue(submission, "question_email_", submission.userEmail || "N/A")
  }

  const getCorporateEmail = (submission: any) => {
    return getFieldValue(submission, "question_corporateEmail_")
  }

  const getDesignation = (submission: any) => {
    return getFieldValue(submission, "question_designation_")
  }

  const getEventOrganizer = (submission: any) => {
    return getFieldValue(submission, "question_eventOrganizer_")
  }

  const getIsMicrosoftMVP = (submission: any) => {
    const value = getFieldValue(submission, "question_isMicrosoftMVP_")
    return typeof value === "boolean" ? (value ? "Yes" : "No") : value
  }

  const getMvpId = (submission: any) => {
    return getFieldValue(submission, "question_mvpId_")
  }

  const getMvpProfileLink = (submission: any) => {
    return getFieldValue(submission, "question_mvpProfileLink_")
  }

  const getMvpCategory = (submission: any) => {
    return getFieldValue(submission, "question_mvpCategory_")
  }

  const getHowManyEventsVolunteered = (submission: any) => {
    return getFieldValue(submission, "question_howManyEventsVolunteered_")
  }

  const getMeetupEventName = (submission: any) => {
    return getFieldValue(submission, "question_meetupEventName_")
  }

  const getEventDetails = (submission: any) => {
    return getFieldValue(submission, "question_eventDetails_")
  }

  const getMeetupPageDetails = (submission: any) => {
    return getFieldValue(submission, "question_meetupPageDetails_")
  }

  const getYourContribution = (submission: any) => {
    return getFieldValue(submission, "question_yourContribution_")
  }

  const getOrganizerName = (submission: any) => {
    return getFieldValue(submission, "question_organizerName_")
  }

  const getLinkedIn = (submission: any) => {
    return getFieldValue(submission, "question_linkedinId_")
  }

  const getGitHub = (submission: any) => {
    return getFieldValue(submission, "question_githubId_")
  }

  const getOtherSocialMedia = (submission: any) => {
    return getFieldValue(submission, "question_otherSocialMediaId_")
  }

  const getMobileNumber = (submission: any) => {
    return getFieldValue(submission, "question_mobileNumber_")
  }

  const handleViewSubmission = (submission: any) => {
    setSelectedSubmission(submission)
    setDialogOpen(true)
  }

  const handleUpdateStatus = async (submissionId: string, newStatus: string) => {
    try {
      const submission = submissions.find((sub) => sub._id === submissionId)
      if (!submission) {
        throw new Error("Submission not found")
      }

      const response = await fetch(`/api/events/${eventId}/submissions/volunteer/${submissionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          volunteerEmail: getEmail(submission),
          volunteerName: getName(submission),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update submission status")
      }

      // Update the submission in the local state
      setSubmissions(submissions.map((sub) => (sub._id === submissionId ? { ...sub, status: newStatus } : sub)))

      toast({
        title: "Status Updated",
        description: `Volunteer submission ${newStatus}`,
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
      setSelectedSubmissions(submissions.map((sub) => sub._id))
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

  const formatFieldName = (key: string) => {
    // Remove question_ prefix and _numbers suffix
    let formattedKey = key.replace(/^question_/, "").replace(/_\d+$/, "")

    // Convert camelCase to Title Case
    formattedKey = formattedKey
      .replace(/([A-Z])/g, " $1") // Add space before capital letters
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
          <span className="ml-2">Loading volunteer submissions...</span>
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
          {selectedSubmissions.length > 0 && (
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                // Implement bulk approve functionality
                toast({
                  title: "Bulk Approve",
                  description: "This feature is coming soon",
                })
              }}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve Selected ({selectedSubmissions.length})
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => {
              // Implement export functionality
              toast({
                title: "Export",
                description: "This feature is coming soon",
              })
            }}
          >
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>

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
        <Tabs defaultValue="basic" className="mb-6">
          <TabsList>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="mvp">MVP Details</TabsTrigger>
            <TabsTrigger value="events">Event Experience</TabsTrigger>
            <TabsTrigger value="contact">Contact Info</TabsTrigger>
          </TabsList>

          {submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No volunteer submissions found.</p>
            </div>
          ) : (
            <>
              <TabsContent value="basic" className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={() => toggleSelectAll()}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Corporate Email</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Event Organizer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission._id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedSubmissions.includes(submission._id)}
                            onCheckedChange={() => toggleSubmission(submission._id)}
                            aria-label="Select row"
                          />
                        </TableCell>
                        <TableCell>{getName(submission)}</TableCell>
                        <TableCell>{getEmail(submission)}</TableCell>
                        <TableCell>{getCorporateEmail(submission)}</TableCell>
                        <TableCell>{getDesignation(submission)}</TableCell>
                        <TableCell>{getEventOrganizer(submission)}</TableCell>
                        <TableCell>{getStatusBadge(submission.status)}</TableCell>
                        <TableCell>
                          {submission.createdAt &&
                            formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-right">
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
                                  onClick={() => handleUpdateStatus(submission._id, "approved")}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleUpdateStatus(submission._id, "rejected")}
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
              </TabsContent>

              <TabsContent value="mvp" className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Is Microsoft MVP</TableHead>
                      <TableHead>MVP ID</TableHead>
                      <TableHead>MVP Profile Link</TableHead>
                      <TableHead>MVP Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={`mvp-${submission._id}`}>
                        <TableCell>{getName(submission)}</TableCell>
                        <TableCell>{getIsMicrosoftMVP(submission)}</TableCell>
                        <TableCell>{getMvpId(submission)}</TableCell>
                        <TableCell>{getMvpProfileLink(submission)}</TableCell>
                        <TableCell>{getMvpCategory(submission)}</TableCell>
                        <TableCell>{getStatusBadge(submission.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleViewSubmission(submission)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="events" className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Events Volunteered</TableHead>
                      <TableHead>Meetup Event Name</TableHead>
                      <TableHead>Event Details</TableHead>
                      <TableHead>Meetup Page Details</TableHead>
                      <TableHead>Contribution</TableHead>
                      <TableHead>Organizer Name</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={`events-${submission._id}`}>
                        <TableCell>{getName(submission)}</TableCell>
                        <TableCell>{getHowManyEventsVolunteered(submission)}</TableCell>
                        <TableCell>{getMeetupEventName(submission)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{getEventDetails(submission)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{getMeetupPageDetails(submission)}</TableCell>
                        <TableCell>{getYourContribution(submission)}</TableCell>
                        <TableCell>{getOrganizerName(submission)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleViewSubmission(submission)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="contact" className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>LinkedIn</TableHead>
                      <TableHead>GitHub</TableHead>
                      <TableHead>Other Social Media</TableHead>
                      <TableHead>Mobile Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={`contact-${submission._id}`}>
                        <TableCell>{getName(submission)}</TableCell>
                        <TableCell>{getEmail(submission)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{getLinkedIn(submission)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{getGitHub(submission)}</TableCell>
                        <TableCell>{getOtherSocialMedia(submission)}</TableCell>
                        <TableCell>{getMobileNumber(submission)}</TableCell>
                        <TableCell>{getStatusBadge(submission.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleViewSubmission(submission)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </>
          )}
        </Tabs>
      </CardContent>

      {/* Submission Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Volunteer Application Details</DialogTitle>
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
                  <p>{getName(selectedSubmission)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                  <p>{getEmail(selectedSubmission)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <p>{getStatusBadge(selectedSubmission.status)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Application ID</h3>
                  <p className="text-xs">{selectedSubmission._id}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Form Responses</h3>
                <div className="space-y-3">
                  {selectedSubmission.data &&
                    Object.entries(selectedSubmission.data).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-3 gap-2">
                        <div className="font-medium text-sm">{formatFieldName(key)}</div>
                        <div className="col-span-2">
                          {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {selectedSubmission.status === "pending" && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="text-green-600 hover:text-green-700"
                    onClick={() => {
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
                      handleUpdateStatus(selectedSubmission._id, "rejected")
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
