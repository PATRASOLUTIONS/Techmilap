"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Eye, CheckCircle, XCircle, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

interface SubmissionsTableProps {
  eventId: string
  formType: "attendee" | "volunteer" | "speaker"
  title: string
  description: string
  filterStatus?: "pending" | "approved" | "rejected"
}

export function SubmissionsTable({ eventId, formType, title, description, filterStatus }: SubmissionsTableProps) {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([])

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true)
        console.log(`Fetching ${formType} submissions for event: ${eventId}`)

        // Build the query URL with filters
        let url = `/api/events/${eventId}/submissions/${formType}`
        const params = new URLSearchParams()

        if (filterStatus) {
          params.append("status", filterStatus)
        }

        if (searchQuery) {
          params.append("search", searchQuery)
        }

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
          throw new Error(`Failed to fetch ${formType} submissions (Status: ${response.status})`)
        }

        const data = await response.json()
        console.log(`${formType} submissions data:`, data)

        setSubmissions(data.submissions || [])
      } catch (error) {
        console.error(`Error fetching ${formType} submissions:`, error)
        setError(error instanceof Error ? error.message : `Failed to load ${formType} submissions`)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : `Failed to load ${formType} submissions`,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissions()
  }, [eventId, formType, filterStatus, searchQuery, toast])

  const handleViewSubmission = (submission: any) => {
    setSelectedSubmission(submission)
    setDialogOpen(true)
  }

  const handleUpdateStatus = async (submissionId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/submissions/${formType}/${submissionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update submission status")
      }

      // Update the submission in the local state
      setSubmissions(submissions.map((sub: any) => (sub._id === submissionId ? { ...sub, status: newStatus } : sub)))

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
      const response = await fetch(`/api/events/${eventId}/submissions/${formType}/bulk-approve`, {
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
      setSubmissions(
        submissions.map((sub: any) => (selectedSubmissions.includes(sub._id) ? { ...sub, status: "approved" } : sub)),
      )
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

  const allSelected = submissions.length > 0 && selectedSubmissions.length === submissions.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedSubmissions([])
    } else {
      setSelectedSubmissions(submissions.map((sub: any) => sub._id))
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
          <span className="ml-2">Loading submissions...</span>
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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleBulkApprove} disabled={selectedSubmissions.length === 0}>
            <CheckCircle className="h-4 w-4 mr-1" />
            Bulk Approve
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
        {submissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No submissions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission: any) => (
                  <TableRow key={submission._id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedSubmissions.includes(submission._id)}
                        onCheckedChange={() => toggleSubmission(submission._id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {submission.data?.firstName || submission.data?.name || "Anonymous"}
                    </TableCell>
                    <TableCell>{submission.data?.email || "N/A"}</TableCell>
                    <TableCell>
                      {submission.createdAt && formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>{getStatusBadge(submission.status)}</TableCell>
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
                  <p>{selectedSubmission.data?.firstName || selectedSubmission.data?.name || "Anonymous"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                  <p>{selectedSubmission.data?.email || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <p>{getStatusBadge(selectedSubmission.status)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Submission ID</h3>
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
                        <div className="col-span-2">{String(value)}</div>
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
