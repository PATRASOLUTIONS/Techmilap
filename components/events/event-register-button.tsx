"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { EventRegistrationDialog } from "./event-registration-dialog"

interface EventRegisterButtonProps {
  eventId: string
  eventTitle: string
  organizerEmail?: string
}

export function EventRegisterButton({ eventId, eventTitle, organizerEmail }: EventRegisterButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isOrganizer, setIsOrganizer] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if the current user is the organizer
    const userEmail = sessionStorage.getItem("userEmail")
    setIsOrganizer(userEmail === organizerEmail)
    setIsLoading(false)
  }, [organizerEmail])

  const handleRegister = () => {
    if (isOrganizer) {
      // If organizer, redirect to event dashboard
      router.push(`/event-dashboard/${eventId}`)
    } else {
      // Otherwise open registration dialog
      setIsOpen(true)
    }
  }

  if (isLoading) {
    return (
      <Button disabled className="w-full">
        Loading...
      </Button>
    )
  }

  return (
    <>
      <Button onClick={handleRegister} className="w-full">
        {isOrganizer ? "Manage Event" : "Register"}
      </Button>
      <EventRegistrationDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        eventId={eventId}
        eventTitle={eventTitle}
      />
    </>
  )
}
