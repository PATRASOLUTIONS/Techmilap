"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Ticket, Users, TrendingUp } from "lucide-react"
import { AnimatedCounter } from "@/components/ui/animated-counter"

interface EventStatsProps {
  totalEvents: number
  activeEvents: number
  totalAttendees: number
  ticketsSold: number
}

export function EventStats({ totalEvents, activeEvents, totalAttendees, ticketsSold }: EventStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <AnimatedCounter from={0} to={totalEvents} />
          </div>
          <p className="text-xs text-muted-foreground">+{Math.floor(totalEvents * 0.1)} from last month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Events</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <AnimatedCounter from={0} to={activeEvents} />
          </div>
          <p className="text-xs text-muted-foreground">{activeEvents} events currently live</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <AnimatedCounter from={0} to={totalAttendees} />
          </div>
          <p className="text-xs text-muted-foreground">+{Math.floor(totalAttendees * 0.15)} from last month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
          <Ticket className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <AnimatedCounter from={0} to={ticketsSold} />
          </div>
          <p className="text-xs text-muted-foreground">+{Math.floor(ticketsSold * 0.2)} from last month</p>
        </CardContent>
      </Card>
    </div>
  )
}
