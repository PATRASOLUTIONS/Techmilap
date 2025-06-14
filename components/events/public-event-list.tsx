import { PublicEventCard } from "./public-event-card"
import { getImageUrl } from "@/lib/image-utils"

interface Event {
  _id: string
  slug?: string
  title: string
  description?: string
  date?: string
  endDate?: string
  startTime?: string
  endTime?: string
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

  // Process events to ensure image URLs are properly formatted
  const processedEvents = events.map((event) => ({
    ...event,
    image: getImageUrl(event.image),
  }))

  console.log("Processed Events: from PublicEventList:", processedEvents)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {processedEvents.map((event) => (
        <PublicEventCard key={event._id.toString()} event={event} />
      ))}
    </div>
  )
}

export type { Event }
