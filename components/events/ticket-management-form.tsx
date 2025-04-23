"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { CalendarIcon, Plus, Trash2, Ticket } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { TicketPreview } from "./ticket-preview"
import { useToast } from "@/hooks/use-toast"

interface TicketManagementFormProps {
  data: any[]
  updateData: (data: any[]) => void
  eventId?: string
}

export function TicketManagementForm({ data = [], updateData, eventId }: TicketManagementFormProps) {
  const { toast } = useToast()
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [selectedDesign, setSelectedDesign] = useState("modern")
  const [eventName, setEventName] = useState("Your Event")

  useEffect(() => {
    const fetchEventName = async () => {
      if (eventId) {
        try {
          const response = await fetch(`/api/events/${eventId}`, {
            headers: {
              "Cache-Control": "no-cache",
            },
          })
          if (response.ok) {
            const data = await response.json()
            setEventName(data.event?.title || "Your Event")
          } else {
            console.error("Failed to fetch event name")
          }
        } catch (error) {
          console.error("Error fetching event name:", error)
        }
      }
    }

    fetchEventName()
  }, [eventId])

  const handleAddTicket = () => {
    const newTicket = {
      id: Date.now().toString(),
      name: `Ticket ${data.length + 1}`,
      type: "General Admission",
      pricingModel: "Free",
      price: "0",
      quantity: "100",
      saleStartDate: new Date().toISOString(),
      saleEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      feeStructure: "Organizer",
    }

    // Add the new ticket without validation (validation happens on form submission)
    const updatedTickets = [...data, newTicket]
    updateData(updatedTickets)
    setSelectedTicket(newTicket)
  }

  const handleRemoveTicket = (id) => {
    const updatedTickets = data.filter((ticket) => ticket.id !== id)
    updateData(updatedTickets)

    if (selectedTicket && selectedTicket.id === id) {
      setSelectedTicket(updatedTickets[0] || null)
    }
  }

  const handleTicketChange = (id, field, value) => {
    const updatedTickets = data.map((ticket) => {
      if (ticket.id === id) {
        return {
          ...ticket,
          [field]: value,
        }
      }
      return ticket
    })

    updateData(updatedTickets)

    if (selectedTicket && selectedTicket.id === id) {
      setSelectedTicket({ ...selectedTicket, [field]: value })
    }
  }

  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket)
  }

  const validateTickets = () => {
    if (data.length === 0) {
      toast({
        title: "No tickets added",
        description: "Please add at least one ticket to continue.",
        variant: "destructive",
      })
      return false
    }

    // Check if any tickets have empty required fields
    const invalidTickets = data.filter((ticket) => !ticket.name)
    if (invalidTickets.length > 0) {
      toast({
        title: "Incomplete ticket information",
        description: "Please provide a name for all tickets.",
        variant: "destructive",
      })
      return false
    }

    return true
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
      <motion.div className="flex items-center justify-between" variants={item}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Ticket className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Ticket Management
          </h2>
        </div>
        <Button onClick={handleAddTicket} size="sm" className="button-hover bg-gradient-to-r from-primary to-secondary">
          <Plus className="mr-2 h-4 w-4" />
          Add Ticket
        </Button>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div variants={item} className="space-y-4">
          <h3 className="text-lg font-medium">Ticket Types ({data.length})</h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            <AnimatePresence>
              {data.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary/20 rounded-lg text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Ticket className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                    No Tickets Created
                  </h3>
                  <p className="text-muted-foreground mt-2 mb-4 max-w-md">
                    Create tickets for your event to allow attendees to register.
                  </p>
                  <Button onClick={handleAddTicket} className="button-hover bg-gradient-to-r from-primary to-secondary">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Ticket
                  </Button>
                </motion.div>
              ) : (
                data.map((ticket, index) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={cn(
                        "overflow-hidden cursor-pointer transition-all hover:shadow-md",
                        selectedTicket && selectedTicket.id === ticket.id ? "border-primary" : "",
                      )}
                      onClick={() => handleSelectTicket(ticket)}
                    >
                      <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">{ticket.name || `Ticket #${index + 1}`}</CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveTicket(ticket.id)
                          }}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove ticket</span>
                        </Button>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{ticket.type}</span>
                          <span className="font-medium">
                            {ticket.pricingModel === "Free" ? "Free" : `$${ticket.price}`}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {data.length > 0 && (
            <Button onClick={handleAddTicket} variant="outline" className="w-full mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Another Ticket
            </Button>
          )}
        </motion.div>

        <motion.div variants={item} className="space-y-4">
          {selectedTicket ? (
            <Card className="p-4 space-y-3 pt-6">
              <h3 className="text-lg font-medium">Ticket Details</h3>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Ticket Name</Label>
                    <Input
                      id="name"
                      value={selectedTicket.name}
                      onChange={(e) => handleTicketChange(selectedTicket.id, "name", e.target.value)}
                      placeholder="e.g., Early Bird, VIP, etc."
                      className="transition-all focus:ring-2 focus:ring-primary/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Ticket Type</Label>
                    <Select
                      value={selectedTicket.type}
                      onValueChange={(value) => handleTicketChange(selectedTicket.id, "type", value)}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select ticket type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General Admission">General Admission</SelectItem>
                        <SelectItem value="Early Bird">Early Bird</SelectItem>
                        <SelectItem value="VIP">VIP</SelectItem>
                        <SelectItem value="Student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Pricing Model</Label>
                  <Select
                    value={selectedTicket.pricingModel}
                    onValueChange={(value) => handleTicketChange(selectedTicket.id, "pricingModel", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pricing model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Free">Free</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Donation">Donation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedTicket.pricingModel === "Paid" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={selectedTicket.price}
                        onChange={(e) => handleTicketChange(selectedTicket.id, "price", e.target.value)}
                        className="transition-all focus:ring-2 focus:ring-primary/50"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Fee Structure</Label>
                      <Select
                        value={selectedTicket.feeStructure}
                        onValueChange={(value) => handleTicketChange(selectedTicket.id, "feeStructure", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select fee structure" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Organizer">Absorbed by Organizer</SelectItem>
                          <SelectItem value="Buyer">Passed to Buyer</SelectItem>
                          <SelectItem value="Split">Split Between Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity Available</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={selectedTicket.quantity}
                    onChange={(e) => handleTicketChange(selectedTicket.id, "quantity", e.target.value)}
                    className="transition-all focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Sale Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedTicket.saleStartDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedTicket.saleStartDate
                            ? format(new Date(selectedTicket.saleStartDate), "PPP")
                            : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedTicket.saleStartDate ? new Date(selectedTicket.saleStartDate) : undefined}
                          onSelect={(date) =>
                            handleTicketChange(selectedTicket.id, "saleStartDate", date ? date.toISOString() : null)
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Sale End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedTicket.saleEndDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedTicket.saleEndDate
                            ? format(new Date(selectedTicket.saleEndDate), "PPP")
                            : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedTicket.saleEndDate ? new Date(selectedTicket.saleEndDate) : undefined}
                          onSelect={(date) =>
                            handleTicketChange(selectedTicket.id, "saleEndDate", date ? date.toISOString() : null)
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <TicketPreview
                  ticket={selectedTicket}
                  eventDetails={{
                    name: eventName,
                    startDate: new Date().toISOString(),
                    startTime: "10:00",
                    endTime: "18:00",
                    venue: "Event Venue",
                  }}
                  selectedDesign={selectedDesign}
                  onSelectDesign={setSelectedDesign}
                />
              </div>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 border-2 border-dashed border-muted rounded-lg text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Ticket className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No Ticket Selected</h3>
              <p className="text-muted-foreground mt-2 mb-4">
                Select a ticket from the list or create a new one to edit its details.
              </p>
              <Button onClick={handleAddTicket} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add New Ticket
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
