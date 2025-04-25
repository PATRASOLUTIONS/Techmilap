"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Calendar, MapPin } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface PastEvent {
  _id: string
  title: string
  date: string
  location: string
  slug?: string
}

export function PastEventsDropdown() {
  const [pastEvents, setPastEvents] = useState<PastEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPastEvents = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/events/past")

        if (!response.ok) {
          throw new Error("Failed to fetch past events")
        }

        const data = await response.json()
        setPastEvents(data.events)
      } catch (err) {
        console.error("Error fetching past events:", err)
        setError("Failed to load past events")
      } finally {
        setLoading(false)
      }
    }

    fetchPastEvents()
  }, [])

  // Helper function to get the event URL (slug or ID)
  const getEventUrl = (event: PastEvent) => {
    return event.slug || event._id.toString()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative">
          Past Events
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel>Past Events</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <DropdownMenuGroup className="p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col space-y-2 mb-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </DropdownMenuGroup>
        ) : error ? (
          <div className="p-4 text-center text-sm text-muted-foreground">{error}</div>
        ) : pastEvents.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No past events found</div>
        ) : (
          <DropdownMenuGroup className="max-h-[300px] overflow-y-auto">
            {pastEvents.map((event) => (
              <DropdownMenuItem key={event._id} asChild>
                <Link href={`/my-events/details/${getEventUrl(event)}`} className="cursor-pointer">
                  <div className="flex flex-col w-full">
                    <span className="font-medium">{event.title}</span>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/my-events" className="cursor-pointer justify-center font-medium">
            View All Events
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
