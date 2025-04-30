import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, UserPlus } from "lucide-react"

interface FormSuccessMessageProps {
  title: string
  message: string
  eventId: string
  formType: string
}

export function FormSuccessMessage({ title, message, eventId, formType }: FormSuccessMessageProps) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
      <div className="flex justify-center mb-4">
        <CheckCircle className="h-16 w-16 text-green-500" />
      </div>
      <h2 className="text-2xl font-bold text-green-800 mb-4">{title}</h2>
      <p className="text-green-700 mb-6">{message}</p>

      {/* Only show the register again button for registration forms */}
      {formType === "register" || formType === "attendee" ? (
        <div className="mt-6">
          <Button asChild variant="outline" className="gap-2">
            <Link href={`/events/${eventId}/forms/${formType}`}>
              <UserPlus className="h-4 w-4" />
              Register Again For Your Friend
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  )
}
