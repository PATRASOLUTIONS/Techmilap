import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPinIcon, Clock, Users } from "lucide-react"
import { format } from "date-fns"
import Image from "next/image"

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

export function PublicEventCard({ event }: { event: Event }) {
  // Handle potential missing or invalid date
  let formattedDate = "Date TBA"
  let formattedTime = "Time TBA"

  try {
    if (event.date) {
      const eventDate = new Date(event.date)
      if (!isNaN(eventDate.getTime())) {
        formattedDate = format(eventDate, "EEEE, MMMM d, yyyy")
        formattedTime = format(eventDate, "h:mm a")
      }
    }
  } catch (error) {
    console.error(`Error formatting date for event ${event._id}:`, error)
  }

  // Use slug if available, otherwise use _id
  const eventId = event.slug || event._id.toString()

  return (
    <Link href={`/events/${eventId}`} className="group">
      <Card className="overflow-hidden border-none shadow-md transition-all duration-200 hover:shadow-lg h-full">
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={event.image || "/placeholder.svg?height=400&width=600&query=tech+event"}
            alt={event.title}
            width={600}
            height={400}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={false}
            loading="lazy"
          />
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {event.category && <Badge className="bg-primary/90 hover:bg-primary text-white">{event.category}</Badge>}
            {event.eventType === "recent" && (
              <Badge className="bg-green-500/90 hover:bg-green-500 text-white">New</Badge>
            )}
            {event.eventType === "past" && <Badge className="bg-gray-500/90 hover:bg-gray-500 text-white">Past</Badge>}
          </div>
        </div>
        <CardContent className="p-5">
          <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>

          <div className="space-y-2 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{formattedTime}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}
            {event.organizerInfo?.name && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="line-clamp-1">By {event.organizerInfo.name}</span>
              </div>
            )}
          </div>

          {event.price !== undefined && (
            <div className="mt-4">
              <Badge variant="outline" className="text-primary border-primary">
                {event.price === 0 ? "Free" : `$${event.price}`}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
