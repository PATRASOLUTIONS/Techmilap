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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from "lucide-react"

export default function SuperAdminEventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  })
  const [search, setSearch] = useState("")

  async function fetchEvents(page = 1, searchTerm = "") {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/events?page=${page}&limit=${pagination.limit}&search=${searchTerm}`)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}: Failed to fetch events`)
      }

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
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 font-medium mb-2">Error loading events</div>
              <div className="text-sm text-gray-600">{error}</div>
              <Button variant="outline" className="mt-4" onClick={() => fetchEvents(pagination.page, search)}>
                Try Again
              </Button>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">No events found</div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
