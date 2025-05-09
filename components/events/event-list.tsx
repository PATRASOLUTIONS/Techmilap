import { EventCard } from "@/components/events/event-card"

interface EventListProps {
  events: any[]
  showRegisterButton?: boolean
}

export function EventList({ events, showRegisterButton = false }: EventListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard key={event._id} event={event} showRegisterButton={showRegisterButton} />
      ))}
    </div>
  )
}
