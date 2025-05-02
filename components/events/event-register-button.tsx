"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, HandHelping, Mic, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useRouter } from "next/navigation"

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
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Safety check for invalid eventId
  if (!eventId) {
    return null
  }

  // If already registered, show a different button
  if (isRegistered) {
    return (
      <Button variant="outline" disabled>
        Already Registered
      </Button>
    )
  }

  // If at capacity and not registered, show a disabled button
  if (isAtCapacity) {
    return (
      <Button variant="outline" disabled>
        Event Full
      </Button>
    )
  }

  // If no forms are published, show a disabled button
  if (!hasAttendeeForm && !hasVolunteerForm && !hasSpeakerForm) {
    return (
      <Button variant="outline" disabled>
        Registration Closed
      </Button>
    )
  }

  // If only attendee form is available, show a direct register button
  if (hasAttendeeForm && !hasVolunteerForm && !hasSpeakerForm) {
    return (
      <Button
        onClick={() => {
          setIsLoading(true)
          router.push(`/events/${eventId}/register`)
        }}
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : "Register"}
      </Button>
    )
  }

  // Otherwise, show dropdown with all available options
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          Register <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
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
