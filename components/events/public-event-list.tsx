import { PublicEventCard } from "./public-event-card"

interface Event {
  _id: string
  slug?: string
  title: string
  description?: string
  date?: string
  endDate?: string
  location?: string
  image?: string
  category?: string
  tags?: string[]
  price?: number
  capacity?: number
  organizerInfo?: {
    name: string
    email: string
  }
  eventType?: "recent" | "upcoming" | "past"
}

export function PublicEventList({ events = [] }: { events: Event[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No events found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <PublicEventCard key={event._id.toString()} event={event} />
      ))}
    </div>
  )
}

export type { Event }
