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
        setLoading(true)
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
                    registrationsCount: statsData.stats?.total || 0,
                    checkedInCount: statsData.stats?.checkedIn || 0,
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
    try {
      if (!dateString) return "Date not available"
      const date = new Date(dateString)

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Date not available"
      }

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Date not available"
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Event Check-in Dashboard</h1>
          <p className="text-muted-foreground">Manage attendee check-ins for your upcoming events</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden border-0 shadow-md bg-white">
                <CardHeader className="pb-2 bg-gray-50 border-b">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex flex-col space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-2 w-full mt-2" />
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-gray-50 py-3">
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const checkInPercentage = event.registrationsCount
                ? Math.min(100, Math.round(((event.checkedInCount || 0) / event.registrationsCount) * 100))
                : 0

              return (
                <Card
                  key={event._id}
                  className="overflow-hidden border shadow-md hover:shadow-lg transition-shadow duration-300 bg-white"
                >
                  <CardHeader className="pb-3 border-b bg-gradient-to-r from-gray-50 to-white">
                    <CardTitle className="line-clamp-1 text-lg">{event.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1.5 mt-1">
                      <Calendar className="h-3.5 w-3.5 text-gray-500" />
                      <span>{formatDate(event.startDate)}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex flex-col space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <div className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-1.5">
                            <Users className="h-3.5 w-3.5" /> Registrations
                          </div>
                          <div className="font-semibold text-lg">{event.registrationsCount || 0}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <div className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-1.5">
                            <QrCode className="h-3.5 w-3.5" /> Checked In
                          </div>
                          <div className="font-semibold text-lg">{event.checkedInCount || 0}</div>
                        </div>
                      </div>

                      {event.registrationsCount > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Check-in Progress</span>
                            <span className="font-medium">{checkInPercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full ${
                                checkInPercentage > 75
                                  ? "bg-green-500"
                                  : checkInPercentage > 40
                                    ? "bg-blue-500"
                                    : "bg-amber-500"
                              }`}
                              style={{ width: `${checkInPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-gray-50 py-3">
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-colors"
                    >
                      <Link href={`/event-dashboard/${event._id}/check-in`}>
                        <QrCode className="mr-2 h-4 w-4" /> Start Check-in Process
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 border rounded-lg bg-white shadow-sm">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium mb-2">No Events Found</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              You don't have any upcoming events to check in attendees. Create an event to get started with the check-in
              process.
            </p>
            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-colors"
            >
              <Link href="/dashboard/events/create">Create an Event</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
