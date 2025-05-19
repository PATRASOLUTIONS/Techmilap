"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { motion } from "framer-motion"
import { Trash2, Plus, Ticket, DollarSign, Calendar } from "lucide-react"
import { useSession } from "next-auth/react"

export function TicketManagementForm({ data = [], updateData, eventId = null, toast }) {
  const { data: session } = useSession()
  const [tickets, setTickets] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTicket, setNewTicket] = useState({
    name: "",
    description: "",
    pricingModel: "Free",
    price: 0,
    quantity: 100,
    saleStartDate: "",
    saleEndDate: "",
    ticketNumber: `TICKET-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    userId: session?.user?.id || "system-generated",
  })

  // Initialize tickets from props
  useEffect(() => {
    if (Array.isArray(data) && data.length > 0) {
      // Ensure each ticket has the required fields
      const processedTickets = data.map((ticket, index) => ({
        ...ticket,
        ticketNumber: ticket.ticketNumber || `TICKET-${Date.now()}-${index}-${Math.floor(Math.random() * 10000)}`,
        userId: ticket.userId || session?.user?.id || "system-generated",
      }))
      setTickets(processedTickets)
    } else {
      // Create a default free ticket if none exists
      const defaultTicket = {
        name: "General Admission",
        description: "Standard entry to the event",
        pricingModel: "Free",
        price: 0,
        quantity: 100,
        saleStartDate: "",
        saleEndDate: "",
        ticketNumber: `TICKET-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        userId: session?.user?.id || "system-generated",
      }
      setTickets([defaultTicket])
      updateData([defaultTicket])
    }
  }, [data, session?.user?.id])

  // Update parent component when tickets change
  useEffect(() => {
    updateData(tickets)
  }, [tickets, updateData])

  const handleAddTicket = () => {
    // Validate the new ticket
    if (!newTicket.name) {
      toast({
        title: "Missing Information",
        description: "Please provide a name for the ticket.",
        variant: "destructive",
      })
      return
    }

    if (newTicket.pricingModel === "Paid" || newTicket.pricingModel === "Donation") {
      toast({
        title: "Premium Feature",
        description: `${newTicket.pricingModel} tickets require a premium subscription. Only Free tickets are available in the free plan.`,
        variant: "warning",
      })

      // Reset to Free
      setNewTicket({
        ...newTicket,
        pricingModel: "Free",
        price: 0,
      })
      return
    }

    // Add the new ticket to the list
    const ticketToAdd = {
      ...newTicket,
      ticketNumber: newTicket.ticketNumber || `TICKET-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      userId: newTicket.userId || session?.user?.id || "system-generated",
    }

    setTickets([...tickets, ticketToAdd])

    // Reset the form
    setNewTicket({
      name: "",
      description: "",
      pricingModel: "Free",
      price: 0,
      quantity: 100,
      saleStartDate: "",
      saleEndDate: "",
      ticketNumber: `TICKET-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      userId: session?.user?.id || "system-generated",
    })

    setShowAddForm(false)
  }

  const handleRemoveTicket = (index) => {
    const newTickets = [...tickets]
    newTickets.splice(index, 1)
    setTickets(newTickets)
  }

  const handlePricingModelChange = (value) => {
    if (value === "Paid" || value === "Donation") {
      toast({
        title: "Premium Feature",
        description: `${value} tickets require a premium subscription. Only Free tickets are available in the free plan.`,
        variant: "warning",
      })
      return
    }

    setNewTicket({
      ...newTicket,
      pricingModel: "Free",
      price: 0,
    })
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { y: 10, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
  }

  return (
    <motion.div className="space-y-8" variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Ticket Management
          </h2>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            variant="outline"
            className="flex items-center gap-2"
            type="button"
          >
            {showAddForm ? "Cancel" : <Plus className="h-4 w-4" />}
            {showAddForm ? "Cancel" : "Add Ticket"}
          </Button>
        </div>

        {showAddForm && (
          <Card className="mb-6 border-dashed border-2 border-primary/30">
            <CardContent className="p-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ticketName">Ticket Name</Label>
                  <Input
                    id="ticketName"
                    value={newTicket.name}
                    onChange={(e) => setNewTicket({ ...newTicket, name: e.target.value })}
                    placeholder="General Admission"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticketQuantity">Quantity Available</Label>
                  <Input
                    id="ticketQuantity"
                    type="number"
                    min="1"
                    value={newTicket.quantity}
                    onChange={(e) => setNewTicket({ ...newTicket, quantity: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticketDescription">Description</Label>
                <Textarea
                  id="ticketDescription"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Standard entry to the event"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Pricing Model</Label>
                <RadioGroup
                  value={newTicket.pricingModel}
                  onValueChange={handlePricingModelChange}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2 rounded-md border p-3 transition-colors hover:bg-muted/50">
                    <RadioGroupItem value="Free" id="free" />
                    <Label htmlFor="free" className="flex-1 cursor-pointer">
                      Free
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-md border p-3 transition-colors hover:bg-muted/50 opacity-50">
                    <RadioGroupItem value="Paid" id="paid" disabled />
                    <Label htmlFor="paid" className="flex-1 cursor-pointer">
                      Paid <span className="text-xs text-muted-foreground ml-1">(Premium)</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-md border p-3 transition-colors hover:bg-muted/50 opacity-50">
                    <RadioGroupItem value="Donation" id="donation" disabled />
                    <Label htmlFor="donation" className="flex-1 cursor-pointer">
                      Donation <span className="text-xs text-muted-foreground ml-1">(Premium)</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {newTicket.pricingModel === "Paid" && (
                <div className="space-y-2">
                  <Label htmlFor="ticketPrice">Price</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ticketPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newTicket.price}
                      onChange={(e) => setNewTicket({ ...newTicket, price: Number.parseFloat(e.target.value) || 0 })}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="saleStartDate">Sale Start Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="saleStartDate"
                      type="date"
                      value={newTicket.saleStartDate}
                      onChange={(e) => setNewTicket({ ...newTicket, saleStartDate: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saleEndDate">Sale End Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="saleEndDate"
                      type="date"
                      value={newTicket.saleEndDate}
                      onChange={(e) => setNewTicket({ ...newTicket, saleEndDate: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleAddTicket} className="bg-primary">
                  Add Ticket
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {tickets.length === 0 ? (
          <Card className="border-dashed border-2 border-muted">
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center justify-center space-y-3">
                <Ticket className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">No Tickets Added</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Add at least one ticket type for your event. This will allow attendees to register for your event.
                </p>
                <Button onClick={() => setShowAddForm(true)} variant="outline" className="mt-2">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Ticket
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Ticket className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{ticket.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {ticket.pricingModel === "Free"
                            ? "Free"
                            : ticket.pricingModel === "Donation"
                              ? "Donation-based"
                              : `$${ticket.price}`}
                          {ticket.quantity ? ` • ${ticket.quantity} available` : ""}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      onClick={() => handleRemoveTicket(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                  <div className="p-4 bg-muted/30">
                    <p className="text-sm">{ticket.description || "No description provided."}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
