"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Calendar, QrCode, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface Event {
  _id: string
  title: string
  startDate: string
  endDate: string
  location: string
  registrationsCount: number
  checkedInCount: number
}

export default function EventCheckInPage() {
  const { data: session } = useSession()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events/my-events")
        if (response.ok) {
          const data = await response.json()

          // Get check-in stats for each event
          const eventsWithStats = await Promise.all(
            data.events.map(async (event: Event) => {
              try {
                const statsResponse = await fetch(`/api/events/${event._id}/check-ins/stats`)
                if (statsResponse.ok) {
                  const statsData = await statsResponse.json()
                  return {
                    ...event,
                    checkedInCount: statsData.checkedInCount || 0,
                    registrationsCount: statsData.totalCount || 0,
                  }
                }
                return event
              } catch (error) {
                console.error("Error fetching check-in stats:", error)
                return event
              }
            }),
          )

          setEvents(eventsWithStats)
        }
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchEvents()
    }
  }, [session])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Web Check-in</h1>
          <p className="text-muted-foreground">Select an event to start checking in attendees</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event._id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-1">{event.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(event.startDate)}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> Total Registrations
                      </span>
                      <span className="font-medium">{event.registrationsCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <QrCode className="h-3.5 w-3.5" /> Checked In
                      </span>
                      <span className="font-medium">{event.checkedInCount || 0}</span>
                    </div>
                    {event.registrationsCount > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                        <div
                          className="bg-green-600 h-2.5 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.round(((event.checkedInCount || 0) / event.registrationsCount) * 100))}%`,
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/event-dashboard/${event._id}/check-in`}>
                      <QrCode className="mr-2 h-4 w-4" /> Start Check-in
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 border rounded-lg bg-gray-50">
            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Events Found</h3>
            <p className="text-muted-foreground text-center mb-6">
              You don't have any upcoming events to check in attendees.
            </p>
            <Button asChild>
              <Link href="/dashboard/events/create">Create an Event</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
