"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TicketCard } from "./ticket-card"
import { EmptyTickets } from "./empty-tickets"

interface TicketListProps {
  tickets: any[]
}

export function TicketList({ tickets }: TicketListProps) {
  const [activeTab, setActiveTab] = useState("all")

  if (!tickets || tickets.length === 0) {
    return <EmptyTickets />
  }

  const attendeeTickets = tickets.filter((ticket) => ticket.ticketType === "attendee")
  const volunteerTickets = tickets.filter((ticket) => ticket.ticketType === "volunteer")
  const speakerTickets = tickets.filter((ticket) => ticket.ticketType === "speaker")
  const upcomingTickets = tickets.filter((ticket) => {
    const eventDate = new Date(ticket.date)
    return eventDate >= new Date()
  })
  const pastTickets = tickets.filter((ticket) => {
    const eventDate = new Date(ticket.date)
    return eventDate < new Date()
  })

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-4">
          <TabsTrigger value="all">All ({tickets.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcomingTickets.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastTickets.length})</TabsTrigger>
          <TabsTrigger value="attendee">Attendee ({attendeeTickets.length})</TabsTrigger>
          <TabsTrigger value="volunteer">Volunteer ({volunteerTickets.length})</TabsTrigger>
          <TabsTrigger value="speaker">Speaker ({speakerTickets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {tickets.map((ticket, index) => (
            <TicketCard key={ticket._id} ticket={ticket} index={index} />
          ))}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-6">
          {upcomingTickets.length > 0 ? (
            upcomingTickets.map((ticket, index) => <TicketCard key={ticket._id} ticket={ticket} index={index} />)
          ) : (
            <p className="text-center text-muted-foreground py-8">No upcoming tickets found.</p>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-6">
          {pastTickets.length > 0 ? (
            pastTickets.map((ticket, index) => <TicketCard key={ticket._id} ticket={ticket} index={index} />)
          ) : (
            <p className="text-center text-muted-foreground py-8">No past tickets found.</p>
          )}
        </TabsContent>

        <TabsContent value="attendee" className="space-y-6">
          {attendeeTickets.length > 0 ? (
            attendeeTickets.map((ticket, index) => <TicketCard key={ticket._id} ticket={ticket} index={index} />)
          ) : (
            <p className="text-center text-muted-foreground py-8">No attendee tickets found.</p>
          )}
        </TabsContent>

        <TabsContent value="volunteer" className="space-y-6">
          {volunteerTickets.length > 0 ? (
            volunteerTickets.map((ticket, index) => <TicketCard key={ticket._id} ticket={ticket} index={index} />)
          ) : (
            <p className="text-center text-muted-foreground py-8">No volunteer tickets found.</p>
          )}
        </TabsContent>

        <TabsContent value="speaker" className="space-y-6">
          {speakerTickets.length > 0 ? (
            speakerTickets.map((ticket, index) => <TicketCard key={ticket._id} ticket={ticket} index={index} />)
          ) : (
            <p className="text-center text-muted-foreground py-8">No speaker tickets found.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
