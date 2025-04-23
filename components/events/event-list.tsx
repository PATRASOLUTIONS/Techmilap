"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Calendar, Clock, MapPin, Users, UserPlus, Mic, HandHelping } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { EventRegistrationDialog } from "./event-registration-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface EventListProps {
  events: any[]
  showRegisterButton?: boolean
  showUserRole?: boolean
}

export function EventList({ events, showRegisterButton = false, showUserRole = false }: EventListProps) {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)

  const handleRegister = (event: any) => {
    setSelectedEvent(event)
    setIsRegistrationOpen(true)
  }

  // Helper function to get the event URL (slug or ID)
  const getEventUrl = (event: any) => {
    return event.slug || event._id.toString()
  }

  // Helper function to get role badge if available
  const getRoleBadge = (event: any) => {
    if (!showUserRole || !event.userRole) return null

    switch (event.userRole) {
      case "organizer":
        return <Badge className="bg-primary/20 text-primary border-primary/30">Organizer</Badge>
      case "speaker":
        return <Badge className="bg-secondary/20 text-secondary border-secondary/30">Speaker</Badge>
      case "volunteer":
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">Volunteer</Badge>
      case "attendee":
        return <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">Attendee</Badge>
      default:
        return null
    }
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <Card key={event._id} className="overflow-hidden flex flex-col h-full">
          <div className="relative h-48 w-full">
            <Image src={event.image || "/community-celebration.png"} alt={event.title} fill className="object-cover" />
            <div className="absolute top-2 right-2 flex gap-2">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                {event.category}
              </Badge>
              {getRoleBadge(event)}
            </div>
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="line-clamp-1">{event.title}</CardTitle>
            <CardDescription>
              {typeof event.organizer === "object"
                ? `Organized by ${event.organizer.firstName} ${event.organizer.lastName}`
                : "Organized by TechEventPlanner"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2 flex-grow">
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{new Date(event.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>
                  {event.attendees?.length || 0} / {event.capacity} attendees
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm line-clamp-2">{event.description}</p>
          </CardContent>
          <CardFooter className="pt-2">
            <div className="flex gap-2 w-full">
              <Button asChild variant="outline" className="flex-1">
                <Link href={`/my-events/details/${getEventUrl(event)}`}>View Details</Link>
              </Button>
              {showRegisterButton && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="flex-1">Register</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href={`/events/${getEventUrl(event)}/register`} className="flex items-center">
                        <UserPlus className="mr-2 h-4 w-4" />
                        <span>Attendee Registration</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/events/${getEventUrl(event)}/volunteer`} className="flex items-center">
                        <HandHelping className="mr-2 h-4 w-4" />
                        <span>Volunteer Application</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/events/${getEventUrl(event)}/speaker`} className="flex items-center">
                        <Mic className="mr-2 h-4 w-4" />
                        <span>Speaker Application</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardFooter>
        </Card>
      ))}

      {selectedEvent && (
        <EventRegistrationDialog event={selectedEvent} open={isRegistrationOpen} onOpenChange={setIsRegistrationOpen} />
      )}
    </div>
  )
}
