import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

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
      <Link href={`/events/${eventId}/register`} passHref>
        <Button className="bg-green-600 hover:bg-green-700">Register for your friend also</Button>
      </Link>
    </div>
  )
}
