"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Calendar, Clock, MapPin, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDate } from "@/lib/utils"

interface EventRegistrationDialogProps {
  event: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EventRegistrationDialog({ event, open, onOpenChange }: EventRegistrationDialogProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleRegister = async () => {
    if (!session) {
      router.push("/login")
      return
    }

    setIsRegistering(true)
    setError("")

    try {
      const response = await fetch(`/api/events/${event._id}/register`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to register for event")
      }

      setSuccess(true)
      setTimeout(() => {
        onOpenChange(false)
        router.refresh()
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Register for Event</DialogTitle>
          <DialogDescription>You are about to register for the following event:</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <h3 className="font-semibold text-lg">{event.title}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{new Date(event.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>
                {event.attendees?.length || 0} / {event.capacity} attendees
              </span>
            </div>
          </div>
          {error && <div className="text-sm text-red-500 mt-2">{error}</div>}
          {success && (
            <div className="text-sm text-green-500 mt-2">
              Registration successful! You are now registered for this event.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRegister} disabled={isRegistering || success}>
            {isRegistering ? "Registering..." : "Confirm Registration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
