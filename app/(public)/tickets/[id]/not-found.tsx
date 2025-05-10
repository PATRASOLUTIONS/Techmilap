import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function TicketNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-xl p-8 shadow-md border border-gray-200">
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ticket Not Found</h1>

          <p className="text-gray-600 mb-6">The ticket you're looking for doesn't exist or may have been removed.</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/events">Browse Events</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Return Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
