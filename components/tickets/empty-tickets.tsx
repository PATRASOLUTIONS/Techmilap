import Link from "next/link"
import { TicketIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function EmptyTickets() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
        <TicketIcon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No tickets found</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        You don't have any tickets yet. Register for events, apply as a volunteer, or submit a speaker proposal to get
        tickets.
      </p>
      <Button asChild>
        <Link href="/events">Browse Events</Link>
      </Button>
    </div>
  )
}
