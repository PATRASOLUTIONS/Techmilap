"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface PublishAllFormsButtonProps {
  eventId: string
  onSuccess?: () => void
}

export function PublishAllFormsButton({ eventId, onSuccess }: PublishAllFormsButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false)
  const { toast } = useToast()

  const handlePublishAllForms = async () => {
    if (!eventId || isPublishing) return

    try {
      setIsPublishing(true)

      const response = await fetch(`/api/events/${eventId}/publish-all-forms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to publish forms")
      }

      toast({
        title: "Forms Published",
        description: "All forms for this event have been published successfully.",
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error publishing forms:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to publish forms. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <Button
      onClick={handlePublishAllForms}
      disabled={isPublishing}
      className="bg-gradient-to-r from-primary to-secondary"
    >
      {isPublishing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Publishing...
        </>
      ) : (
        "Publish All Forms"
      )}
    </Button>
  )
}
