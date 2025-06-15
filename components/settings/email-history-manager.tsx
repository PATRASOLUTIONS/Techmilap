"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2, Eye, Search, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EmailHistoryManagerProps {
  userId: string
}

interface SentEmail {
  _id: string
  recipientEmail: string
  recipientName?: string
  subject: string
  content: string
  emailType: string
  status: string
  createdAt: string
  updatedAt: string
  eventId?: string
  templateId?: string
  designTemplate?: string
  metadata?: Record<string, any>
}

export function EmailHistoryManager({ userId }: EmailHistoryManagerProps) {
  const [emails, setEmails] = useState<SentEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [emailType, setEmailType] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const { toast } = useToast()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // Debounce search query
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setCurrentPage(1) // Reset to first page when search query changes
    }, 500) // 500ms delay

    return () => {
      clearTimeout(timerId)
    }
  }, [searchQuery])

  // Load emails on component mount and when filters change
  useEffect(() => {
    fetchEmails()
  }, [currentPage, itemsPerPage, emailType, status, debouncedSearchQuery])

  const fetchEmails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build the query URL
      let url = `/api/emails/sent?page=${currentPage}&limit=${itemsPerPage}`

      if (emailType) url += `&emailType=${emailType}`
      if (status) url += `&status=${status}`
      if (debouncedSearchQuery) url += `&recipientEmail=${debouncedSearchQuery}` // Use debouncedSearchQuery

      console.log(url)

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error("Failed to fetch email history")
      }

      const data = await response.json()
      console.log(data)
      setEmails(data.emails)
      setTotalPages(data.pagination?.pages || 0)
      setTotalItems(data.pagination?.total || 0)
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching email history")
      toast({
        title: "Error",
        description: "Failed to load email history",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewEmail = (email: SentEmail) => {
    setSelectedEmail(email)
    setDialogOpen(true)
  }

  const handleResendEmail = async (emailId: string) => {
    try {
      setLoading(true)

      const response = await fetch(`/api/emails/sent/${emailId}/resend`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to resend email")
      }

      toast({
        title: "Success",
        description: "Email resent successfully",
      })

      // Refresh the email list
      fetchEmails()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to resend email",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-500 text-white border-green-500">Sent</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "pending":
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  const getEmailTypeBadge = (type: string) => {
    switch (type) {
      case "success":
        return <Badge className="bg-green-500 text-white border-green-500">Approval</Badge>
      case "rejection":
        return <Badge className="bg-red-500 text-white border-red-500">Rejection</Badge>
      case "ticket":
        return <Badge className="bg-blue-500 text-white border-blue-500">Ticket</Badge>
      case "certificate":
        return <Badge className="bg-purple-500 text-white border-purple-500">Certificate</Badge>
      case "reminder":
        return <Badge className="bg-yellow-500 text-white border-yellow-500">Reminder</Badge>
      case "custom":
      default:
        return <Badge variant="outline">Custom</Badge>
    }
  }

  // Pagination handlers
  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages))
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  if (loading && emails.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email History</CardTitle>
          <CardDescription>View and manage all emails sent to your event attendees.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading email history...</span>
        </CardContent>
      </Card>
    )
  }

  if (error && emails.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email History</CardTitle>
          <CardDescription>View and manage all emails sent to your event attendees.</CardDescription>
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
          <CardTitle>Email History</CardTitle>
          <CardDescription>View and manage all emails sent to your event attendees.</CardDescription>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Select value={emailType} onValueChange={(value) => {
              setEmailType(value === "all" ? "" : value)
              setCurrentPage(1)
            }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Email Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="success">Approval</SelectItem>
                <SelectItem value="rejection">Rejection</SelectItem>
                <SelectItem value="ticket">Ticket</SelectItem>
                <SelectItem value="certificate">Certificate</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(value) => {
              setStatus(value === "all" ? "" : value)
              setCurrentPage(1)
            }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                className="pl-8 w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Button variant="outline" onClick={fetchEmails} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {emails.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No emails found.</p>
          </div>
        ) : (
          <div className="border rounded-md">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emails.map((email) => (
                    <TableRow key={email._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{email.recipientName || "N/A"}</div>
                          <div className="text-sm text-muted-foreground">{email.recipientEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">{email.subject}</TableCell>
                      <TableCell>{getEmailTypeBadge(email.emailType)}</TableCell>
                      <TableCell>{getStatusBadge(email.status)}</TableCell>
                      <TableCell>{formatDistanceToNow(new Date(email.createdAt), { addSuffix: true })}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewEmail(email)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {email.status !== "sent" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResendEmail(email._id)}
                              disabled={loading}
                            >
                              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
                              Resend
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>

      {emails.length > 0 && (
        <CardFooter className="flex items-center justify-between px-6 py-4 border-t">
          <div className="flex items-center">
            <p className="text-sm text-muted-foreground">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{" "}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} emails
            </p>
            <div className="ml-4 flex items-center space-x-2">
              <Label htmlFor="itemsPerPage" className="text-sm">
                Show
              </Label>
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder="20" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm">entries</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={goToPrevPage} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous Page</span>
            </Button>

            <div className="flex items-center">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around current page
                let pageNum = 0
                if (totalPages <= 5) {
                  // If 5 or fewer pages, show all
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  // If near start, show first 5
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  // If near end, show last 5
                  pageNum = totalPages - 4 + i
                } else {
                  // Otherwise show current and 2 on each side
                  pageNum = currentPage - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => goToPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages}>
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next Page</span>
            </Button>
          </div>
        </CardFooter>
      )}

      {/* Email Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Details</DialogTitle>
            <DialogDescription>
              Sent{" "}
              {selectedEmail &&
                selectedEmail.createdAt &&
                formatDistanceToNow(new Date(selectedEmail.createdAt), { addSuffix: true })}
            </DialogDescription>
          </DialogHeader>

          {selectedEmail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Recipient</h3>
                  <p>{selectedEmail.recipientName || "N/A"}</p>
                  <p className="text-sm text-muted-foreground">{selectedEmail.recipientEmail}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <div>{getStatusBadge(selectedEmail.status)}</div>
                </div>
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Subject</h3>
                  <p>{selectedEmail.subject}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Email Content</h3>
                <div className="border rounded-md p-4 bg-white">
                  <div dangerouslySetInnerHTML={{ __html: selectedEmail.content }} />
                </div>
              </div>

              {selectedEmail.metadata && Object.keys(selectedEmail.metadata).length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Metadata</h3>
                  <div className="space-y-2">
                    {Object.entries(selectedEmail.metadata).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-3 gap-2">
                        <div className="font-medium text-sm">{key}</div>
                        <div className="col-span-2">{JSON.stringify(value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEmail.status !== "sent" && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleResendEmail(selectedEmail._id)
                      setDialogOpen(false)
                    }}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
                    Resend Email
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
