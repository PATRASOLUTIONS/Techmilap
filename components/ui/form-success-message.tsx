import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, UserPlus } from "lucide-react"

interface FormSuccessMessageProps {
  title?: string
  message?: string
  formType?: "attendee" | "volunteer" | "speaker"
  eventId?: string
}

export function FormSuccessMessage({
  title = "Submission Successful!",
  message = "Your form has been submitted successfully.",
  formType,
  eventId,
}: FormSuccessMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 rounded-full bg-green-100 p-3">
        <CheckCircle className="h-12 w-12 text-green-600" />
      </div>
      <h2 className="mb-2 text-2xl font-bold">{title}</h2>
      <p className="mb-6 max-w-md text-gray-600">{message}</p>

      {formType === "attendee" && eventId && (
        <div className="mt-4 space-y-4">
          <div className="text-sm text-gray-600">Want to bring someone along?</div>
          <Link href={`/events/${eventId}/register`} passHref>
            <Button className="bg-green-600 hover:bg-green-700">
              <UserPlus className="mr-2 h-4 w-4" />
              Register for your friend also
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
