"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface EventRegisterButtonProps {
  eventId: string
  eventSlug?: string
  isRegistered: boolean
  isAtCapacity: boolean
  hasAttendeeForm: boolean
  hasVolunteerForm: boolean
  hasSpeakerForm: boolean
}

export function EventRegisterButton({
  eventId,
  eventSlug,
  isRegistered,
  isAtCapacity,
  hasAttendeeForm,
  hasVolunteerForm,
  hasSpeakerForm,
}: EventRegisterButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Use slug if available, otherwise use ID
  const eventUrl = eventSlug || eventId

  if (isRegistered) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <Check className="h-4 w-4" />
        Registered
      </Button>
    )
  }

  if (isAtCapacity && hasAttendeeForm) {
    return <Button disabled>Event Full</Button>
  }

  // If there's only one form type available, show a direct button
  if (hasAttendeeForm && !hasVolunteerForm && !hasSpeakerForm) {
    return (
      <Button asChild>
        <Link href={`/events/${eventUrl}/register`}>Register</Link>
      </Button>
    )
  }

  // If there are multiple form types, show a dropdown
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button className="gap-1">
          Register <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {hasAttendeeForm && !isAtCapacity && (
          <DropdownMenuItem asChild>
            <Link href={`/events/${eventUrl}/register`}>Register as Attendee</Link>
          </DropdownMenuItem>
        )}
        {hasVolunteerForm && (
          <DropdownMenuItem asChild>
            <Link href={`/events/${eventUrl}/volunteer`}>Apply as Volunteer</Link>
          </DropdownMenuItem>
        )}
        {hasSpeakerForm && (
          <DropdownMenuItem asChild>
            <Link href={`/events/${eventUrl}/speaker`}>Apply as Speaker</Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
