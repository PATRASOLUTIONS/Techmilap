import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPinIcon, Clock, Users, Calendar } from "lucide-react"
import { format, isValid, parseISO, differenceInDays } from "date-fns"
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
}

export function PublicEventCard({ event }: { event: Event }) {
  // Handle potential missing or invalid date
  let formattedDate = "Date TBA"
  let formattedTime = "Time TBA"
  let isMultiDayEvent = false
  let durationText = ""

  try {
    if (event.date) {
      const eventDate = parseISO(event.date)
      if (isValid(eventDate)) {
        formattedDate = format(eventDate, "EEEE, MMMM d, yyyy")
        formattedTime = format(eventDate, "h:mm a")

        // Check if it's a multi-day event
        if (event.endDate) {
          const endDate = parseISO(event.endDate)
          if (isValid(endDate)) {
            const daysDiff = differenceInDays(endDate, eventDate)
            if (daysDiff > 0) {
              isMultiDayEvent = true
              durationText = `${daysDiff + 1}-day event`
              formattedDate = `${format(eventDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error formatting date for event ${event._id}:`, error)
  }

  const eventId = event.slug || event._id

  // Truncate description
  const truncatedDescription =
    event.description && event.description.length > 100
      ? `${event.description.substring(0, 100)}...`
      : event.description

  return (
    <Link href={`/events/${eventId}`} className="group">
      <Card className="overflow-hidden border-none shadow-md transition-all duration-200 hover:shadow-lg h-full flex flex-col">
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={
              event.image || `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(event.title || "event")}`
            }
            alt={event.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
            {event.category && <Badge className="bg-primary/90 hover:bg-primary text-white">{event.category}</Badge>}
            {isMultiDayEvent && (
              <Badge variant="outline" className="bg-white/90 text-black border-none">
                <Calendar className="h-3 w-3 mr-1" />
                {durationText}
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="p-5 flex-1 flex flex-col">
          <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>

          {truncatedDescription && (
            <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{truncatedDescription}</p>
          )}

          <div className="space-y-2 mt-auto text-sm">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{formattedTime}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}
            {event.organizerInfo?.name && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="line-clamp-1">By {event.organizerInfo.name}</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {event.price !== undefined && (
              <Badge variant="outline" className="text-primary border-primary">
                {event.price === 0 ? "Free" : `$${event.price}`}
              </Badge>
            )}
            {event.capacity && (
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                Capacity: {event.capacity}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
