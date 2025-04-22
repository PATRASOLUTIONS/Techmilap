import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { VariantProps } from "class-variance-authority"

interface PublicEventRegisterButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  eventId: string
  formType: "register" | "volunteer" | "speaker"
  variant?: VariantProps<typeof Button>["variant"]
  size?: VariantProps<typeof Button>["size"]
  buttonText?: string
  isFormPublished?: boolean
  className?: string
}

export function PublicEventRegisterButton({
  eventId,
  formType,
  variant = "default",
  size = "default",
  buttonText,
  isFormPublished = true,
  className = "",
  ...props
}: PublicEventRegisterButtonProps) {
  // Map form types to their display text and URLs
  const formTypeConfig = {
    register: {
      text: "Register",
      url: `/events/${eventId}/forms/register`,
    },
    volunteer: {
      text: "Volunteer",
      url: `/events/${eventId}/forms/volunteer`,
    },
    speaker: {
      text: "Apply to Speak",
      url: `/events/${eventId}/forms/speaker`,
    },
  }

  // Use the provided button text or the default for this form type
  const text = buttonText || formTypeConfig[formType].text

  const getButtonText = () => {
    return buttonText || formTypeConfig[formType].text
  }

  if (!isFormPublished) {
    return (
      <Button variant="outline" size={size} disabled className={className} {...props}>
        {text} (Not Available)
      </Button>
    )
  }

  return (
    <Button variant={variant} size={size} asChild className={className} {...props}>
      <Link href={`/events/${eventId}/${formType}`}>{getButtonText()}</Link>
    </Button>
  )
}
