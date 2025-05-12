"use client"

import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QRScanner } from "@/components/check-in/qr-scanner"
import { CheckInResult } from "@/components/check-in/check-in-result"
import { CheckInStats } from "@/components/check-in/check-in-stats"
import { CheckInHistory } from "@/components/check-in/check-in-history"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, QrCode, Search, BarChart, History, Bug } from "lucide-react"
import Link from "next/link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function EventCheckInPage() {
  const { id } = useParams() || {}
  const eventId = Array.isArray(id) ? id[0] : id
  const router = useRouter()
  const { toast } = useToast()

  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("scan")
  const [manualTicketId, setManualTicketId] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<"prompt" | "granted" | "denied">("prompt")
  const [debugMode, setDebugMode] = useState(false)
  const [attendeesList, setAttendeesList] = useState<any[]>([])
  const [loadingAttendees, setLoadingAttendees] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [allowDuplicateCheckIn, setAllowDuplicateCheckIn] = useState(false)

  // Stop scanning when switching away from scan tab
  useEffect(() => {
    if (activeTab !== "scan" && isScanning) {
      console.log("Stopping scanner because tab changed")
      setIsScanning(false)
    }
  }, [activeTab, isScanning])

  // We don't check camera permission on page load anymore
  // We'll let the QRScanner component handle this when the user clicks "Start Scanning"

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/events/${eventId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch event details")
        }

        const data = await response.json()
        setEvent(data.event)
      } catch (err: any) {
        console.error("Error fetching event:", err)
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchEvent()
    }
  }, [eventId, toast])

  const fetchAttendees = async () => {
    try {
      setLoadingAttendees(true)
      const response = await fetch(`/api/events/${eventId}/submissions?formType=attendee&status=approved`)

      if (!response.ok) {
        throw new Error("Failed to fetch attendees")
      }

      const data = await response.json()

      // Transform the data to include name and email
      const transformedAttendees = data.submissions.map((submission: any) => {
        const formData = submission.formData || {}
        const name =
          formData.name ||
          formData.fullName ||
          (formData.firstName && formData.lastName ? `${formData.firstName} ${formData.lastName}` : null) ||
          submission.userName ||
          "Unknown"

        const email = formData.email || formData.emailAddress || submission.userEmail || "No email"

        return {
          _id: submission._id,
          name,
          email,
          isCheckedIn: submission.isCheckedIn || false,
          checkInCount: submission.checkInCount || 0,
          checkedInAt: submission.checkedInAt,
          formData,
        }
      })

      setAttendeesList(transformedAttendees || [])
    } catch (err: any) {
      console.error("Error fetching attendees:", err)
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoadingAttendees(false)
    }
  }

  const handleScan = async (data: string) => {
    try {
      // Stop scanning while processing
      setIsScanning(false)
      setIsProcessing(true)

      // Process the scanned QR code
      const ticketId = data.trim()

      // Call the check-in API
      const response = await fetch("/api/tickets/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketId,
          eventId,
          allowDuplicateCheckIn,
        }),
      })

      const result = await response.json()

      // Set the scan result
      setScanResult(result)

      // Show toast notification
      if (result.success) {
        if (result.status === "duplicate_check_in") {
          toast({
            title: "Duplicate Check-in",
            description: `${result.attendee?.name || result.ticket?.name || "Attendee"} has been checked in again.`,
            variant: "warning",
          })
        } else {
          toast({
            title: "Check-in Successful",
            description: `${result.attendee?.name || result.ticket?.name || "Attendee"} has been checked in.`,
            variant: "default",
          })
        }
      } else if (result.status === "already_checked_in") {
        toast({
          title: "Already Checked In",
          description: `${result.attendee?.name || result.ticket?.name || "Attendee"} was already checked in ${result.checkInCount > 1 ? result.checkInCount + " times" : ""}.`,
          variant: "warning",
        })
      } else {
        toast({
          title: "Invalid Ticket",
          description: result.message || "This ticket is not valid for this event.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      console.error("Error processing scan:", err)
      toast({
        title: "Error",
        description: "Failed to process the scan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!manualTicketId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a ticket ID, email, or name",
        variant: "destructive",
      })
      return
    }

    try {
      setIsProcessing(true)

      // Call the check-in API
      const response = await fetch("/api/tickets/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketId: manualTicketId.trim(),
          eventId,
          allowDuplicateCheckIn,
        }),
      })

      const result = await response.json()

      // Set the scan result
      setScanResult(result)

      // Show toast notification
      if (result.success) {
        if (result.status === "duplicate_check_in") {
          toast({
            title: "Duplicate Check-in",
            description: `${result.attendee?.name || result.ticket?.name || "Attendee"} has been checked in again.`,
            variant: "warning",
          })
        } else {
          toast({
            title: "Check-in Successful",
            description: `${result.attendee?.name || result.ticket?.name || "Attendee"} has been checked in.`,
            variant: "default",
          })
        }
      } else if (result.status === "already_checked_in") {
        toast({
          title: "Already Checked In",
          description: `${result.attendee?.name || result.ticket?.name || "Attendee"} was already checked in ${result.checkInCount > 1 ? result.checkInCount + " times" : ""}.`,
          variant: "warning",
        })
      } else {
        toast({
          title: "Invalid Ticket",
          description: result.message || "This ticket is not valid for this event.",
          variant: "destructive",
        })
      }

      // Clear the input
      setManualTicketId("")
    } catch (err: any) {
      console.error("Error processing manual check-in:", err)
      toast({
        title: "Error",
        description: "Failed to process the check-in. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const resetScan = () => {
    setScanResult(null)
    setIsScanning(true)
  }

  const toggleDebugMode = () => {
    setDebugMode(!debugMode)
    if (!debugMode && attendeesList.length === 0) {
      fetchAttendees()
    }
  }

  const handleSelectAttendee = (attendee: any) => {
    if (attendee._id) {
      setManualTicketId(attendee._id)
      setActiveTab("manual")
      setDebugMode(false)
    }
  }

  const filteredAttendees = searchTerm
    ? attendeesList.filter(
        (attendee) =>
          attendee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          attendee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          attendee._id.toString().includes(searchTerm),
      )
    : attendeesList

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/event-dashboard/${eventId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex flex-col gap-2">
            <div className="h-8 w-64 bg-muted animate-pulse rounded-md"></div>
            <div className="h-5 w-32 bg-muted animate-pulse rounded-md"></div>
          </div>
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/event-dashboard/${eventId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{event?.title || "Event"} Check-in</h1>
            <p className="text-sm text-muted-foreground">Scan tickets and manage attendee check-ins</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch id="allow-duplicate" checked={allowDuplicateCheckIn} onCheckedChange={setAllowDuplicateCheckIn} />
            <Label htmlFor="allow-duplicate" className="text-sm">
              Allow duplicate check-ins
            </Label>
          </div>
          <Button variant="outline" size="sm" onClick={toggleDebugMode}>
            <Bug className="h-4 w-4 mr-2" />
            {debugMode ? "Hide Debug" : "Debug Mode"}
          </Button>
        </div>
      </div>

      {debugMode && (
        <Card className="mb-6 border-dashed border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">Debug Mode</CardTitle>
            <CardDescription>Use this mode to troubleshoot check-in issues and view attendee data</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              <AccordionItem value="attendees">
                <AccordionTrigger>
                  View Approved Attendees ({loadingAttendees ? "Loading..." : attendeesList.length})
                </AccordionTrigger>
                <AccordionContent>
                  <div className="mb-4">
                    <Input
                      placeholder="Search by name, email or ID"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="mb-2"
                    />
                  </div>

                  {loadingAttendees ? (
                    <div className="text-center py-4">Loading attendees...</div>
                  ) : attendeesList.length === 0 ? (
                    <div className="text-center py-4">No approved attendees found for this event</div>
                  ) : filteredAttendees.length === 0 ? (
                    <div className="text-center py-4">No attendees match your search</div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredAttendees.map((attendee) => (
                        <div
                          key={attendee._id}
                          className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                          onClick={() => handleSelectAttendee(attendee)}
                        >
                          <div>
                            <div className="font-medium">{attendee.name}</div>
                            <div className="text-sm text-gray-500">{attendee.email}</div>
                            <div className="text-xs text-gray-400">ID: {attendee._id}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {attendee.isCheckedIn && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Checked In {attendee.checkInCount > 1 ? `(${attendee.checkInCount}x)` : ""}
                              </Badge>
                            )}
                            <Button size="sm" variant="outline">
                              Select
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {scanResult && (
                <AccordionItem value="result">
                  <AccordionTrigger>Last Check-in Result Details</AccordionTrigger>
                  <AccordionContent>
                    <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs">
                      {JSON.stringify(scanResult, null, 2)}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              )}

              <AccordionItem value="help">
                <AccordionTrigger>Troubleshooting Tips</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Invalid Ticket Error:</strong> This usually means the system couldn't find a matching
                      ticket or registration.
                    </p>
                    <p>
                      <strong>Check the following:</strong>
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Verify you're checking in for the correct event</li>
                      <li>Make sure the ticket ID is entered correctly</li>
                      <li>Try using the attendee's email address instead of the ID</li>
                      <li>Check if the registration has been approved</li>
                      <li>Verify the attendee is registered for this specific event</li>
                    </ul>
                    <p className="mt-2">
                      <strong>Still having issues?</strong> Use the "View Approved Attendees" option above to find and
                      select the correct attendee.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="scan">
            <QrCode className="h-4 w-4 mr-2" />
            Scan Tickets
          </TabsTrigger>
          <TabsTrigger value="manual">
            <Search className="h-4 w-4 mr-2" />
            Manual Check-in
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart className="h-4 w-4 mr-2" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Check-in History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              {scanResult ? (
                <CheckInResult result={scanResult} onReset={resetScan} />
              ) : (
                <QRScanner onScan={handleScan} isScanning={isScanning} setIsScanning={setIsScanning} />
              )}

              <div className="mt-4 text-sm text-gray-500">
                <p>Scan the QR code on the attendee's ticket to check them in.</p>
                <p>The system will verify the ticket and update the check-in status.</p>
                {!allowDuplicateCheckIn && (
                  <p className="text-amber-600 mt-2">
                    <strong>Note:</strong> Duplicate check-ins are currently disabled. Enable the option above to allow
                    checking in the same attendee multiple times.
                  </p>
                )}
              </div>
            </div>

            <CheckInStats eventId={eventId} refreshInterval={10000} />
          </div>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Manual Check-in</CardTitle>
                  <CardDescription>Enter the ticket ID, email address, or full name of the attendee</CardDescription>
                </CardHeader>
                <CardContent>
                  {scanResult ? (
                    <CheckInResult result={scanResult} onReset={resetScan} />
                  ) : (
                    <form onSubmit={handleManualCheckIn} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="ticketId" className="text-sm font-medium">
                          Ticket ID / Email / Name
                        </label>
                        <Input
                          id="ticketId"
                          placeholder="Enter ticket ID, email address, or full name"
                          value={manualTicketId}
                          onChange={(e) => setManualTicketId(e.target.value)}
                          disabled={isProcessing}
                        />
                        <p className="text-xs text-gray-500">
                          You can enter the ticket ID, registration ID, email address, or full name of the attendee
                        </p>
                      </div>
                      <Button type="submit" className="w-full" disabled={isProcessing}>
                        {isProcessing ? "Processing..." : "Check In"}
                      </Button>
                    </form>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4 text-xs text-gray-500">
                  <div>Having trouble? Try enabling Debug Mode to see all attendees.</div>
                  {!allowDuplicateCheckIn && (
                    <div className="text-amber-600">
                      <strong>Note:</strong> Duplicate check-ins are disabled
                    </div>
                  )}
                </CardFooter>
              </Card>

              <div className="mt-4 text-sm text-gray-500">
                <p>Use this option when the QR code is damaged or cannot be scanned.</p>
                <p>The ticket ID can be found on the printed ticket or in the confirmation email.</p>
              </div>
            </div>

            <CheckInStats eventId={eventId} refreshInterval={10000} />
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <CheckInStats eventId={eventId} refreshInterval={5000} />
        </TabsContent>

        <TabsContent value="history">
          <CheckInHistory eventId={eventId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
