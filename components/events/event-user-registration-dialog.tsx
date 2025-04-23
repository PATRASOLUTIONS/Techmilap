"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface EventUserRegistrationDialogProps {
  eventId: string
  buttonText?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined
  size?: "default" | "sm" | "lg" | "icon" | null | undefined
  className?: string
}

export function EventUserRegistrationDialog({
  eventId,
  buttonText = "Register",
  variant = "default",
  size = "default",
  className = "",
}: EventUserRegistrationDialogProps) {
  const [open, setOpen] = useState(false)
  const [formStatus, setFormStatus] = useState<{
    attendeeForm?: { status: string }
    volunteerForm?: { status: string }
    speakerForm?: { status: string }
    eventSlug?: string
  }>({})
  const [userStatus, setUserStatus] = useState<{
    isAttendee: boolean
    isVolunteer: boolean
    isSpeaker: boolean
  }>({
    isAttendee: false,
    isVolunteer: false,
    isSpeaker: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        setIsLoading(true)
        try {
          // Fetch form status
          const formResponse = await fetch(`/api/events/${eventId}/forms/status`)
          if (formResponse.ok) {
            const formData = await formResponse.json()
            setFormStatus(formData)
          }

          // Fetch user registration status
          const userResponse = await fetch(`/api/events/${eventId}/user-registration-status`)
          if (userResponse.ok) {
            const userData = await userResponse.json()
            setUserStatus(userData)
          }
        } catch (error) {
          console.error("Error fetching data:", error)
        } finally {
          setIsLoading(false)
        }
      }

      fetchData()
    }
  }, [eventId, open])

  const handleOptionClick = (formType: string) => {
    setOpen(false)
    const slug = formStatus.eventSlug || eventId
    router.push(`/events/${slug}/${formType}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registration Options</DialogTitle>
          <DialogDescription>Choose how you would like to participate in this event.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <Button
              onClick={() => handleOptionClick("register")}
              disabled={
                userStatus.isAttendee || !formStatus.attendeeForm || formStatus.attendeeForm.status !== "published"
              }
              className="w-full"
            >
              {userStatus.isAttendee
                ? "Already Registered as Attendee"
                : formStatus.attendeeForm?.status !== "published"
                  ? "Register as Attendee (Not Available)"
                  : "Register as Attendee"}
            </Button>
            <Button
              onClick={() => handleOptionClick("volunteer")}
              disabled={
                userStatus.isVolunteer || !formStatus.volunteerForm || formStatus.volunteerForm.status !== "published"
              }
              variant="outline"
              className="w-full"
            >
              {userStatus.isVolunteer
                ? "Already Applied as Volunteer"
                : formStatus.volunteerForm?.status !== "published"
                  ? "Apply as Volunteer (Not Available)"
                  : "Apply as Volunteer"}
            </Button>
            <Button
              onClick={() => handleOptionClick("speaker")}
              disabled={
                userStatus.isSpeaker || !formStatus.speakerForm || formStatus.speakerForm.status !== "published"
              }
              variant="outline"
              className="w-full"
            >
              {userStatus.isSpeaker
                ? "Already Applied as Speaker"
                : formStatus.speakerForm?.status !== "published"
                  ? "Apply as Speaker (Not Available)"
                  : "Apply as Speaker"}
            </Button>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
