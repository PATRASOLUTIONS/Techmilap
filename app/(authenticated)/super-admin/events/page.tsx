"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Search, AlertCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SuperAdminEventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  })
  const [search, setSearch] = useState("")

  // Fetch user session info to debug role issues
  const fetchUserInfo = async () => {
    try {
      const response = await fetch("/api/debug/user-session")
      const data = await response.json()
      setUserInfo(data)
      return data
    } catch (err) {
      console.error("Error fetching user info:", err)
      return null
    }
  }

  async function fetchEvents(page = 1, searchTerm = "") {
    setLoading(true)
    setError(null)

    try {
      // First check user info if we don't have it yet
      if (!userInfo) {
        await fetchUserInfo()
      }

      const response = await fetch(`/api/admin/events?page=${page}&limit=${pagination.limit}&search=${searchTerm}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error ${response.status}: Failed to fetch events`)
      }

      const data = await response.json()

      if (!data.events) {
        throw new Error("Invalid response format: missing events data")
      }

      setEvents(data.events)
      setPagination(data.pagination)
    } catch (err) {
      console.error("Error fetching events:", err)
      setError(err.message || "An unknown error occurred")
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents(pagination.page, search)
  }, [pagination.page])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchEvents(1, search)
  }

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Events Management</CardTitle>
          <CardDescription>View and manage all events in the system</CardDescription>
          <form onSubmit={handleSearch} className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search events..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error loading events</AlertTitle>
              <AlertDescription className="flex flex-col gap-2">
                <p>{error}</p>
                {userInfo && (
                  <div className="text-sm bg-gray-100 p-2 rounded">
                    <p>
                      Current user role: <strong>{userInfo.user?.role || "Unknown"}</strong>
                    </p>
                    <p>
                      Required role: <strong>admin</strong> or <strong>super-admin</strong>
                    </p>
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchEvents(pagination.page, search)}
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" /> Try Again
                  </Button>
                  <Button variant="outline" size="sm" onClick={fetchUserInfo} className="flex items-center gap-1">
                    Check User Role
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : !error && events.length === 0 ? (
            <div className="text-center py-8">No events found</div>
          ) : (
            !error && (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableCaption>A list of all events in the system</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event Name</TableHead>
                        <TableHead>Organizer Name</TableHead>
                        <TableHead>Organizer Email</TableHead>
                        <TableHead className="text-right">Attendees</TableHead>
                        <TableHead className="text-right">Volunteers</TableHead>
                        <TableHead className="text-right">Speakers</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((event) => (
                        <TableRow key={event._id}>
                          <TableCell className="font-medium">{event.title}</TableCell>
                          <TableCell>{event.organizer?.name || "N/A"}</TableCell>
                          <TableCell>{event.organizer?.email || "N/A"}</TableCell>
                          <TableCell className="text-right">{event.attendeeCount || 0}</TableCell>
                          <TableCell className="text-right">{event.volunteerCount || 0}</TableCell>
                          <TableCell className="text-right">{event.speakerCount || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                        className={pagination.page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const pageNumber = pagination.page <= 3 ? i + 1 : pagination.page + i - 2

                      if (pageNumber > pagination.pages) return null

                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNumber)}
                            isActive={pagination.page === pageNumber}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(Math.min(pagination.pages, pagination.page + 1))}
                        className={
                          pagination.page >= pagination.pages ? "pointer-events-none opacity-50" : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </>
            )
          )}
        </CardContent>
      </Card>
    </div>
  )
}
