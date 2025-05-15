"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, User, Clock, Mail, Info, Globe, Ticket } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface CheckInResultProps {
  result: any
  onReset: () => void
}

export function CheckInResult({ result, onReset }: CheckInResultProps) {
  const [timeAgo, setTimeAgo] = useState<string>("")

  useEffect(() => {
    if (result?.checkedInAt) {
      setTimeAgo(formatDistanceToNow(new Date(result.checkedInAt), { addSuffix: true }))
    }
  }, [result])

  if (!result) return null

  const isSuccess =
    result.status === "checked_in" || result.status === "duplicate_check_in" || result.status === "first_check_in"
  const isAlreadyCheckedIn = result.status === "already_checked_in"
  const isDuplicateCheckIn = result.status === "duplicate_check_in"
  const isInvalid = result.status === "invalid" || result.status === "error"

  const getStatusColor = () => {
    if (isSuccess && !isDuplicateCheckIn) return "bg-green-50 border-green-200"
    if (isSuccess && isDuplicateCheckIn) return "bg-blue-50 border-blue-200"
    if (isAlreadyCheckedIn) return "bg-amber-50 border-amber-200"
    return "bg-red-50 border-red-200"
  }

  const getStatusIcon = () => {
    if (isSuccess && !isDuplicateCheckIn) return <CheckCircle className="h-12 w-12 text-green-500" />
    if (isSuccess && isDuplicateCheckIn) return <CheckCircle className="h-12 w-12 text-blue-500" />
    if (isAlreadyCheckedIn) return <AlertCircle className="h-12 w-12 text-amber-500" />
    return <XCircle className="h-12 w-12 text-red-500" />
  }

  const getStatusText = () => {
    if (isSuccess && !isDuplicateCheckIn) return "Check-in Successful"
    if (isSuccess && isDuplicateCheckIn) return "Duplicate Check-in"
    if (isAlreadyCheckedIn) return "Already Checked In"
    return "Invalid Ticket"
  }

  const getStatusBadge = () => {
    if (isSuccess && !isDuplicateCheckIn) return <Badge className="bg-green-500">Success</Badge>
    if (isSuccess && isDuplicateCheckIn) return <Badge className="bg-blue-500">Duplicate</Badge>
    if (isAlreadyCheckedIn) return <Badge className="bg-amber-500">Already Checked In</Badge>
    return <Badge variant="destructive">Invalid</Badge>
  }

  const attendeeName = result.attendee?.name || result.ticket?.name || result.ticket?.attendeeName || "Unknown"
  const attendeeEmail = result.attendee?.email || result.ticket?.email || result.ticket?.attendeeEmail || "No email"
  const ticketNumber =
    result.ticket?.ticketNumber ||
    result.ticket?.customId ||
    result.ticket?.displayId ||
    result.debug?.ticketId ||
    "Unknown"
  const isWebCheckIn =
    result.debug?.isWebCheckIn || result.attendee?.isWebCheckIn || result.ticket?.isWebCheckIn || false

  return (
    <Card className={`w-full border ${getStatusColor()} transition-all duration-300`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">{getStatusText()}</CardTitle>
        {getStatusBadge()}
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-shrink-0">{getStatusIcon()}</div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <div className="font-medium">{attendeeName}</div>
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {attendeeEmail}
                </div>
                {ticketNumber && (
                  <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Ticket className="h-3 w-3" />
                    Ticket: {ticketNumber}
                  </div>
                )}
              </div>
            </div>

            {(isSuccess || isAlreadyCheckedIn) && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm">
                    {isSuccess ? "Checked in" : "First checked in"}: {timeAgo}
                  </div>
                  {(isAlreadyCheckedIn || isDuplicateCheckIn) && result.checkInCount > 1 && (
                    <div className="text-sm text-amber-600">
                      This ticket has been scanned {result.checkInCount} times
                    </div>
                  )}
                  {isWebCheckIn && (
                    <div className="flex items-center gap-1 text-sm text-blue-600 mt-1">
                      <Globe className="h-3 w-3" />
                      Web check-in
                    </div>
                  )}
                </div>
              </div>
            )}

            {isInvalid && (
              <div className="text-sm text-red-600 mt-2 p-2 bg-red-50 rounded border border-red-100">
                {result.message || "Invalid ticket. Please check the ID and try again."}
              </div>
            )}
          </div>
        </div>

        {/* Debug information accordion */}
        <Accordion type="single" collapsible className="mt-4">
          <AccordionItem value="debug">
            <AccordionTrigger className="text-xs text-gray-500">
              <Info className="h-3 w-3 mr-1" /> Technical Details
            </AccordionTrigger>
            <AccordionContent>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="font-medium">Search Information:</div>
                <div>Search Term: {result.debug?.searchTerm || result.searchTerm || "Unknown"}</div>
                {result.debug?.cleanedTicketId && <div>Cleaned ID: {result.debug.cleanedTicketId}</div>}
                {result.debug?.lookupMethod && <div>Lookup Method: {result.debug.lookupMethod}</div>}

                <div className="font-medium mt-2">Ticket Information:</div>
                {result.ticket?._id && <div>Ticket ID: {result.ticket._id}</div>}
                {result.ticket?.ticketNumber && <div>Ticket Number: {result.ticket.ticketNumber}</div>}
                {result.ticket?.customId && <div>Custom ID: {result.ticket.customId}</div>}
                {result.ticket?.displayId && <div>Display ID: {result.ticket.displayId}</div>}
                {result.ticket?.referenceId && <div>Reference ID: {result.ticket.referenceId}</div>}

                {result.attendee?._id && (
                  <>
                    <div className="font-medium mt-2">Attendee Information:</div>
                    <div>Attendee ID: {result.attendee._id}</div>
                  </>
                )}

                {result.debug?.eventInfo && (
                  <>
                    <div className="font-medium mt-2">Event Information:</div>
                    <div>
                      Event: {result.debug.eventInfo.title} ({result.debug.eventInfo.id})
                    </div>
                  </>
                )}

                {result.attendee?.formData && (
                  <div>
                    <div className="font-medium mt-2">Form Data Fields:</div>
                    <div className="pl-2">
                      {Object.keys(result.attendee.formData).map((key) => (
                        <div key={key}>
                          {key}:{" "}
                          {typeof result.attendee.formData[key] === "string"
                            ? result.attendee.formData[key]
                            : "[complex value]"}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={onReset}>Scan Another Ticket</Button>
      </CardFooter>
    </Card>
  )
}
