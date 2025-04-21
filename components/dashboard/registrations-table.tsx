"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Eye, CheckCircle, XCircle, Download, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface RegistrationsTableProps {
  eventId: string
  title: string
  description: string
}

export function RegistrationsTable({ eventId, title, description }: RegistrationsTableProps) {
  const [registrations, setRegistrations] = useState<any[]>([])
  const [filteredRegistrations, setFilteredRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!eventId) {
        setLoading(false)
        setError("Event ID is missing")
        return
      }

      try {
        setLoading(true)
        console.log(`Fetching registrations for event: ${eventId}`)

        // Use the correct API endpoint for attendee registrations
        const response = await fetch(`/api/events/${eventId}/registrations`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`API Error (${response.status}):`, errorText)
          throw new Error(`Failed to fetch registrations (Status: ${response.status})`)
        }

        const data = await response.json()
        console.log("Registrations data:", data)

        if (!data.registrations) {
          console.warn("No registrations array in response:", data)
          setRegistrations([])
          setFilteredRegistrations([])
        } else {
          setRegistrations(data.registrations)
          setFilteredRegistrations(data.registrations)
        }
      } catch (error) {
        console.error(`Error fetching registrations:`, error)
        setError(error instanceof Error ? error.message : `Failed to load registrations`)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : `Failed to load registrations`,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRegistrations()
  }, [eventId, toast])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredRegistrations(registrations)
    } else {
      const lowercasedSearch = searchTerm.toLowerCase()
      const filtered = registrations.filter((registration) => {
        // Safely access nested properties
        const name = registration.name || ""
        const email = registration.email || ""

        return name.toLowerCase().includes(lowercasedSearch) || email.toLowerCase().includes(lowercasedSearch)
      })
      setFilteredRegistrations(filtered)
    }
  }, [searchTerm, registrations])

  const handleViewRegistration = (registration: any) => {
    setSelectedRegistration(registration)
    setDialogOpen(true)
  }

  const handleUpdateStatus = async (registrationId: string, newStatus: string) => {
    if (!eventId || !registrationId) return

    try {
      const response = await fetch(`/api/events/${eventId}/registrations/${registrationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update registration status")
      }

      // Update the registration in the local state
      setRegistrations(registrations.map((reg) => (reg.id === registrationId ? { ...reg, status: newStatus } : reg)))
      setFilteredRegistrations(
        filteredRegistrations.map((reg) => (reg.id === registrationId ? { ...reg, status: newStatus } : reg)),
      )

      toast({
        title: "Status Updated",
        description: `Registration status updated to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating registration status:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update registration status",
        variant: "destructive",
      })
    }
  }

  const exportToCSV = () => {
    try {
      if (filteredRegistrations.length === 0) {
        toast({
          title: "No data to export",
          description: "There are no registrations to export",
          variant: "destructive",
        })
        return
      }

      // Create CSV header
      let csvContent = "Name,Email,Status,Registered Date\n"

      // Add data rows
      filteredRegistrations.forEach((registration) => {
        const name = (registration.name || "Anonymous").replace(/,/g, " ")
        const email = (registration.email || "N/A").replace(/,/g, " ")
        const status = registration.status || "pending"
        const date = registration.registeredAt ? new Date(registration.registeredAt).toLocaleDateString() : "Unknown"

        csvContent += `${name},${email},${status},${date}\n`
      })

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `event-registrations-${eventId}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export Successful",
        description: "Registrations exported to CSV",
      })
    } catch (error) {
      console.error("Error exporting to CSV:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export registrations",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-500 text-white border-green-500">
            Approved
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      case "pending":
      default:
        return <Badge variant="outline">Pending</Badge>
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
          <span className="ml-2">Loading registrations...</span>
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
        <Button variant="outline" onClick={exportToCSV} disabled={filteredRegistrations.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export to CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 max-w-sm"
            />
          </div>
        </div>

        {filteredRegistrations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No registrations yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((registration: any) => (
                  <TableRow key={registration.id}>
                    <TableCell className="font-medium">{registration.name || "Anonymous"}</TableCell>
                    <TableCell>{registration.email || "N/A"}</TableCell>
                    <TableCell>
                      {registration.registeredAt
                        ? formatDistanceToNow(new Date(registration.registeredAt), { addSuffix: true })
                        : "Unknown"}
                    </TableCell>
                    <TableCell>{getStatusBadge(registration.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewRegistration(registration)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {registration.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleUpdateStatus(registration.id, "approved")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleUpdateStatus(registration.id, "rejected")}
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

      {/* Registration Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registration Details</DialogTitle>
            <DialogDescription>
              Submitted{" "}
              {selectedRegistration &&
                selectedRegistration.registeredAt &&
                formatDistanceToNow(new Date(selectedRegistration.registeredAt), { addSuffix: true })}
            </DialogDescription>
          </DialogHeader>

          {selectedRegistration && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                  <p>{selectedRegistration.name || "Anonymous"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                  <p>{selectedRegistration.email || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <p>{getStatusBadge(selectedRegistration.status)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Registration ID</h3>
                  <p className="text-xs">{selectedRegistration.id}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Form Responses</h3>
                <div className="space-y-3">
                  {selectedRegistration.data &&
                    Object.entries(selectedRegistration.data || {}).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-3 gap-2">
                        <div className="font-medium text-sm">
                          {key.startsWith("question_") ? key.split("_").slice(1, -1).join(" ") : key}
                        </div>
                        <div className="col-span-2">{String(value)}</div>
                      </div>
                    ))}
                </div>
              </div>

              {selectedRegistration.status === "pending" && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="text-green-600 hover:text-green-700"
                    onClick={() => {
                      handleUpdateStatus(selectedRegistration.id, "approved")
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
                      handleUpdateStatus(selectedRegistration.id, "rejected")
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
