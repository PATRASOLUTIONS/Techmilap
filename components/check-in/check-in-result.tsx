"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, User, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

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

  const isSuccess = result.status === "checked_in"
  const isAlreadyCheckedIn = result.status === "already_checked_in"
  const isInvalid = result.status === "invalid"

  const getStatusColor = () => {
    if (isSuccess) return "bg-green-50 border-green-200"
    if (isAlreadyCheckedIn) return "bg-amber-50 border-amber-200"
    return "bg-red-50 border-red-200"
  }

  const getStatusIcon = () => {
    if (isSuccess) return <CheckCircle className="h-12 w-12 text-green-500" />
    if (isAlreadyCheckedIn) return <AlertCircle className="h-12 w-12 text-amber-500" />
    return <XCircle className="h-12 w-12 text-red-500" />
  }

  const getStatusText = () => {
    if (isSuccess) return "Check-in Successful"
    if (isAlreadyCheckedIn) return "Already Checked In"
    return "Invalid Ticket"
  }

  const getStatusBadge = () => {
    if (isSuccess) return <Badge className="bg-green-500">Success</Badge>
    if (isAlreadyCheckedIn) return <Badge className="bg-amber-500">Already Checked In</Badge>
    return <Badge variant="destructive">Invalid</Badge>
  }

  const attendeeName = result.attendee?.name || result.ticket?.name || "Unknown"
  const attendeeEmail = result.attendee?.email || result.ticket?.email || "No email"

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
                <div className="text-sm text-gray-500">{attendeeEmail}</div>
              </div>
            </div>

            {(isSuccess || isAlreadyCheckedIn) && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm">
                    {isSuccess ? "Checked in" : "First checked in"}: {timeAgo}
                  </div>
                  {isAlreadyCheckedIn && result.checkInCount > 1 && (
                    <div className="text-sm text-amber-600">
                      This ticket has been scanned {result.checkInCount} times
                    </div>
                  )}
                </div>
              </div>
            )}

            {isInvalid && <div className="text-sm text-red-600">{result.message}</div>}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={onReset}>Scan Another Ticket</Button>
      </CardFooter>
    </Card>
  )
}
