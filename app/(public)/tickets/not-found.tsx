import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Ticket, AlertCircle } from "lucide-react"

export default function TicketNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Ticket className="h-16 w-16 text-gray-300" />
            <AlertCircle className="h-8 w-8 text-red-500 absolute bottom-0 right-0" />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2">Ticket Not Found</h1>
        <p className="text-gray-600 mb-6">The ticket you're looking for doesn't exist or has been removed.</p>

        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link href="/events">Browse Events</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
