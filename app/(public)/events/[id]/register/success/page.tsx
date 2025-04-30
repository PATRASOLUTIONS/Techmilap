import type { Metadata } from "next"
import { FormSuccessMessage } from "@/components/ui/form-success-message"
import { Card, CardContent } from "@/components/ui/card"

interface SuccessPageProps {
  params: {
    id: string
  }
}

export const metadata: Metadata = {
  title: "Registration Successful",
  description: "Thank you for registering for this event.",
}

export default function RegistrationSuccessPage({ params }: SuccessPageProps) {
  const { id } = params

  return (
    <div className="container max-w-3xl py-12">
      <Card>
        <CardContent className="pt-6">
          <FormSuccessMessage
            title="Registration Successful!"
            message="Thank you for registering for this event. We've sent you a confirmation email with all the details."
            eventId={id}
            formType="attendee"
          />
        </CardContent>
      </Card>
    </div>
  )
}
