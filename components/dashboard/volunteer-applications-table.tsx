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

interface VolunteerApplicationsTableProps {
  eventId: string
  title: string
  description: string
}

export function VolunteerApplicationsTable({ eventId, title, description }: VolunteerApplicationsTableProps) {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true)
        setError(null)

        let url = `/api/events/${eventId}/volunteer-applications`
        if (searchQuery) {
          url += `?search=${encodeURIComponent(searchQuery)}`
        }

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`Failed to fetch volunteer applications (Status: ${response.status})`)
        }

        const data = await response.json()
        console.log("Volunteer applications data:", data)

        setApplications(data.applications || [])
      } catch (error) {
        console.error("Error fetching volunteer applications:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to load volunteer applications"
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

    fetchApplications()
  }, [eventId, searchQuery, toast])

  // Helper function to get value from dynamic field names
  const getFieldValue = (application: any, prefix: string, defaultValue = "N/A") => {
    if (!application || !application.formData) return defaultValue

    // Look for fields that start with the prefix
    for (const key of Object.keys(application.formData)) {
      if (key.startsWith(prefix)) {
        const value = application.formData[key]
        if (value !== undefined && value !== null && value !== "") {
          return value
        }
      }
    }

    // Also check for exact field names
    if (prefix === "name" && application.formData.name) return application.formData.name
    if (prefix === "email" && application.formData.email) return application.formData.email

    return defaultValue
  }

  const getName = (application: any) => {
    return getFieldValue(application, "question_name_", application.formData?.name || "Anonymous")
  }

  const getEmail = (application: any) => {
    return getFieldValue(application, "question_email_", application.formData?.email || "N/A")
  }

  const getCorporateEmail = (application: any) => {
    return getFieldValue(application, "question_corporateEmail_")
  }

  const getDesignation = (application: any) => {
    return getFieldValue(application, "question_designation_")
  }

  const getLinkedIn = (application: any) => {
    return getFieldValue(application, "question_linkedinId_")
  }

  const getGitHub = (application: any) => {
    return getFieldValue(application, "question_githubId_")
  }

  const getOtherSocialMedia = (application: any) => {
    return getFieldValue(application, "question_otherSocialMediaId_")
  }

  const getMobileNumber = (application: any) => {
    return getFieldValue(application, "question_mobileNumber_")
  }

  const handleViewApplication = (application: any) => {
    setSelectedApplication(application)
    setDialogOpen(true)
  }

  const handleUpdateStatus = async (applicationId: string, newStatus: string) => {
    try {
      const application = applications.find((app) => app._id === applicationId)
      if (!application) {
        throw new Error("Application not found")
      }

      const response = await fetch(`/api/events/${eventId}/volunteer-applications/${applicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          volunteerEmail: getEmail(application),
          volunteerName: getName(application),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update application status")
      }

      // Update the application in the local state
      setApplications(applications.map((app) => (app._id === applicationId ? { ...app, status: newStatus } : app)))

      toast({
        title: "Status Updated",
        description: `Volunteer application ${newStatus}`,
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
          <span className="ml-2">Loading volunteer applications...</span>
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
          {selectedApplications.length > 0 && (
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
              Approve Selected ({selectedApplications.length})
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
        {applications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No volunteer applications found.</p>
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
                  <TableHead>Corporate Email</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>LinkedIn</TableHead>
                  <TableHead>GitHub</TableHead>
                  <TableHead>Other Social Media</TableHead>
                  <TableHead>Mobile Number</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => (
                  <TableRow key={application._id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedApplications.includes(application._id)}
                        onCheckedChange={() => toggleApplication(application._id)}
                        aria-label="Select row"
                      />
                    </TableCell>
                    <TableCell>{getName(application)}</TableCell>
                    <TableCell>{getEmail(application)}</TableCell>
                    <TableCell>{getCorporateEmail(application) || "N/A"}</TableCell>
                    <TableCell>{getDesignation(application) || "N/A"}</TableCell>
                    <TableCell>{getLinkedIn(application) || "N/A"}</TableCell>
                    <TableCell>{getGitHub(application) || "N/A"}</TableCell>
                    <TableCell>{getOtherSocialMedia(application) || "N/A"}</TableCell>
                    <TableCell>{getMobileNumber(application) || "N/A"}</TableCell>
                    <TableCell>
                      {application.submittedAt &&
                        formatDistanceToNow(new Date(application.submittedAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>{getStatusBadge(application.status)}</TableCell>
                    <TableCell className="text-right">
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
            <DialogTitle>Volunteer Application Details</DialogTitle>
            <DialogDescription>
              Submitted{" "}
              {selectedApplication &&
                selectedApplication.submittedAt &&
                formatDistanceToNow(new Date(selectedApplication.submittedAt), { addSuffix: true })}
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
                  <h3 className="text-sm font-medium text-muted-foreground">Application ID</h3>
                  <p className="text-xs">{selectedApplication._id}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Form Responses</h3>
                <div className="space-y-3">
                  {selectedApplication.formData &&
                    Object.entries(selectedApplication.formData).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-3 gap-2">
                        <div className="font-medium text-sm">{formatFieldName(key)}</div>
                        <div className="col-span-2">
                          {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                        </div>
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
