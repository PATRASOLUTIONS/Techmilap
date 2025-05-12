"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Search, ChevronLeft, ChevronRight, Download, RefreshCw } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { downloadCSV, objectsToCSV } from "@/lib/csv-export"

interface CheckInHistoryProps {
  eventId: string
}

export function CheckInHistory({ eventId }: CheckInHistoryProps) {
  const [checkIns, setCheckIns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  })

  const fetchCheckIns = async (page = 1, search = "") => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      })

      if (search) {
        queryParams.append("search", search)
      }

      const response = await fetch(`/api/events/${eventId}/check-ins/history?${queryParams.toString()}`, {
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch check-in history")
      }

      const data = await response.json()
      setCheckIns(data.checkIns || [])
      setPagination(data.pagination)
      setError(null)
    } catch (err: any) {
      console.error("Error fetching check-in history:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCheckIns(pagination.page, searchQuery)
  }, [eventId, pagination.page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchCheckIns(1, searchQuery)
  }

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  const exportToCSV = () => {
    if (checkIns.length === 0) return

    // First, fetch all check-ins for export
    const fetchAllForExport = async () => {
      try {
        setLoading(true)
        const queryParams = new URLSearchParams({
          page: "1",
          limit: "1000", // Get a larger batch for export
        })

        if (searchQuery) {
          queryParams.append("search", searchQuery)
        }

        const response = await fetch(`/api/events/${eventId}/check-ins/history?${queryParams.toString()}`)

        if (!response.ok) {
          throw new Error("Failed to fetch data for export")
        }

        const data = await response.json()

        // Format data for CSV
        const exportData = data.checkIns.map((checkIn: any) => ({
          "Attendee Name": checkIn.name,
          Email: checkIn.email,
          "Ticket Type": checkIn.ticketType,
          Status: checkIn.isCheckedIn ? "Checked In" : "Not Checked In",
          "Check-in Time": checkIn.checkedInAt ? format(new Date(checkIn.checkedInAt), "yyyy-MM-dd HH:mm:ss") : "N/A",
          "Checked In By": checkIn.checkedInBy ? checkIn.checkedInBy.name : "N/A",
          "Registration Date": format(new Date(checkIn.createdAt), "yyyy-MM-dd HH:mm:ss"),
        }))

        // Generate filename with event ID and date
        const date = new Date().toISOString().split("T")[0]
        const filename = `event-${eventId}-check-ins-${date}.csv`

        // Convert to CSV and download
        const csvString = objectsToCSV(exportData)
        downloadCSV(csvString, filename)
      } catch (err: any) {
        console.error("Error exporting to CSV:", err)
        setError("Failed to export data: " + err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAllForExport()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Check-in History</CardTitle>
            <CardDescription>View all attendee check-ins</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => fetchCheckIns(pagination.page, searchQuery)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            <Button variant="outline" onClick={exportToCSV} disabled={checkIns.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : checkIns.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500">No check-in data found</div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Attendee</TableHead>
                  <TableHead>Ticket Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  <TableHead>Checked In By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkIns.map((checkIn) => (
                  <TableRow key={checkIn.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{checkIn.name}</div>
                        <div className="text-xs text-gray-500">{checkIn.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{checkIn.ticketType}</TableCell>
                    <TableCell>
                      {checkIn.isCheckedIn ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Checked In
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100">
                          <XCircle className="h-3 w-3 mr-1" />
                          Not Checked In
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {checkIn.checkedInAt ? (
                        <div className="text-sm">
                          {formatDistanceToNow(new Date(checkIn.checkedInAt), { addSuffix: true })}
                          <div className="text-xs text-gray-500">
                            {format(new Date(checkIn.checkedInAt), "MMM d, yyyy h:mm a")}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {checkIn.checkedInBy ? (
                        <div className="text-sm">
                          {checkIn.checkedInBy.name}
                          <div className="text-xs text-gray-500">{checkIn.checkedInBy.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {pagination.totalPages > 1 && (
        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {checkIns.length} of {pagination.totalItems} entries
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                // Calculate which page numbers to show
                let pageNum = 0
                if (pagination.totalPages <= 5) {
                  // If 5 or fewer pages, show all
                  pageNum = i + 1
                } else if (pagination.page <= 3) {
                  // If near start, show first 5
                  pageNum = i + 1
                } else if (pagination.page >= pagination.totalPages - 2) {
                  // If near end, show last 5
                  pageNum = pagination.totalPages - 4 + i
                } else {
                  // Otherwise show current and 2 on each side
                  pageNum = pagination.page - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
