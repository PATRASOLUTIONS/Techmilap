"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { HandHelping, Mic, UserPlus } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface EventRegisterButtonProps {
  eventId: string
  isRegistered?: boolean
  isAtCapacity?: boolean
  hasAttendeeForm?: boolean
  hasVolunteerForm?: boolean
  hasSpeakerForm?: boolean
}

export function EventRegisterButton({
  eventId,
  isRegistered = false,
  isAtCapacity = false,
  hasAttendeeForm = true,
  hasVolunteerForm = false,
  hasSpeakerForm = false,
}: EventRegisterButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Safety check for eventId
  if (!eventId) {
    console.error("EventRegisterButton: No eventId provided")
    return null
  }

  const handleRegister = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to register" }))
        throw new Error(errorData.error || "Failed to register for event")
      }

      toast({
        title: "Registration successful",
        description: "You have been registered for this event.",
      })

      // Refresh the page to update the UI
      window.location.reload()
    } catch (error) {
      console.error("Registration error:", error)
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Failed to register for event",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (isRegistered) {
    return (
      <Button variant="outline" disabled>
        Already Registered
      </Button>
    )
  }

  if (isAtCapacity) {
    return (
      <Button variant="outline" disabled>
        Event Full
      </Button>
    )
  }

  // If we have forms, show dropdown with options
  if (hasAttendeeForm || hasVolunteerForm || hasSpeakerForm) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Register</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {hasAttendeeForm && (
            <DropdownMenuItem asChild>
              <Link href={`/events/${eventId}/register`} className="flex items-center">
                <UserPlus className="mr-2 h-4 w-4" />
                <span>Attendee Registration</span>
              </Link>
            </DropdownMenuItem>
          )}
          {hasVolunteerForm && (
            <DropdownMenuItem asChild>
              <Link href={`/events/${eventId}/volunteer`} className="flex items-center">
                <HandHelping className="mr-2 h-4 w-4" />
                <span>Volunteer Application</span>
              </Link>
            </DropdownMenuItem>
          )}
          {hasSpeakerForm && (
            <DropdownMenuItem asChild>
              <Link href={`/events/${eventId}/speaker`} className="flex items-center">
                <Mic className="mr-2 h-4 w-4" />
                <span>Speaker Application</span>
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Default simple registration button
  return (
    <Button onClick={handleRegister} disabled={loading}>
      {loading ? "Registering..." : "Register"}
    </Button>
  )
}
