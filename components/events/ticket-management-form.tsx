"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { logWithTimestamp } from "@/utils/logger"

type Ticket = {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  ticketType: "Free" | "Paid" | "Donation";
  ticketNumber?: string;
  userId?: string;
};

type TicketManagementFormProps = {
  updateData: (data: { tickets: Ticket[] }) => void;
  handleNext: () => void;
  initialData: Ticket[];
  eventId?: string | null;
  toast?: (options: { title: string; description?: string; variant?: string }) => void;
};

// Define the schema for a single ticket
const ticketSchema = z.object({
  name: z.string().min(1, { message: "Ticket name is required" }),
  description: z.string().optional(),
  price: z.number().min(0, { message: "Price must be a positive number" }),
  quantity: z.number().min(1, { message: "Quantity must be at least 1" }),
  ticketType: z.enum(["Free", "Paid", "Donation"]),
  ticketNumber: z.string().optional(),
  userId: z.string().optional(),
})

// Define the schema for the form
const formSchema = z.object({
  tickets: z.array(ticketSchema).min(1, { message: "At least one ticket type is required" }),
})

export function TicketManagementForm({ updateData, initialData , handleNext}: TicketManagementFormProps) {
  const [tickets, setTickets] = useState(
    initialData || [
      {
        name: "General Admission",
        description: "Standard entry ticket",
        price: 0,
        quantity: 100,
        ticketType: "Free",
        ticketNumber: `TKT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().substring(9)}`,
        userId: "",
      }
    ],
  )

  const { toast } = useToast()
  const { data: session } = useSession()
  // logWithTimestamp("info", "Session Data", session)

  // logWithTimestamp("info", "Initial Tickets Data", initialData)

  // Initialize the form with default values
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tickets,
    },
    mode: "onChange",
  })

  // Add a new ticket
  const addTicket = () => {
    const newTicket = {
      name: "",
      description: "",
      price: 0,
      quantity: 1,
      ticketType: "Free",
      ticketNumber: `TKT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().substring(9)}`,
      userId: session?.user?.id || "",
    }

    const updatedTickets = [...tickets, newTicket]
    setTickets(updatedTickets)
    form.setValue("tickets", updatedTickets)
    handleTicketUpdate(updatedTickets)
  }

  // Remove a ticket
  const removeTicket = (index) => {
    if (tickets.length === 1) {
      toast({
        title: "Cannot Remove",
        description: "You must have at least one ticket type",
        variant: "destructive",
      })
      return
    }

    const updatedTickets = tickets.filter((_, i) => i !== index)
    setTickets(updatedTickets)
    form.setValue("tickets", updatedTickets)
    handleTicketUpdate(updatedTickets)
  }

  // Update a ticket field
  const updateTicket = (index, field, value) => {
    logWithTimestamp("info", `Updating Ticket ${index} Field: ${field}`, value)
    const updatedTickets = [...tickets]
    updatedTickets[index] = { ...updatedTickets[index], [field]: value }

    // If changing ticket type to Paid or Donation, show toast and reset to Free
    if (field === "ticketType" && (value === "Paid" || value === "Donation")) {
      toast({
        title: "Premium Feature",
        description: `${value} tickets are a premium feature. Your ticket will be set to Free.`,
        variant: "default",
      })
      updatedTickets[index].ticketType = "Free"
      updatedTickets[index].price = 0
    }

    setTickets(updatedTickets)
    form.setValue("tickets", updatedTickets)
    handleTicketUpdate(updatedTickets)
  }

  const handleTicketUpdate = (data) => {    
    // Ensure all tickets have ticketNumber and userId
    const processedTickets = data.map((ticket) => ({
      ...ticket,
      ticketNumber:
        ticket.ticketNumber ||
        `TKT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().substring(9)}`,
      userId: ticket.userId || session?.user?.id || "",
    }))

    updateData(processedTickets)
  }

  return (
    <Form {...form}>
      <form className="space-y-8">
        <div className="space-y-6">
          {tickets.map((ticket, index) => (
            <div key={index} className="p-6 border rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Ticket #{index + 1}</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTicket(index)}
                  className="text-destructive hover:text-destructive/90"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormLabel htmlFor={`tickets.${index}.name`}>Ticket Name</FormLabel>
                  <Input
                    id={`tickets.${index}.name`}
                    value={ticket.name}
                    onChange={(e) => updateTicket(index, "name", e.target.value)}
                    placeholder="e.g. General Admission"
                  />
                </div>

                <div>
                  <FormLabel htmlFor={`tickets.${index}.quantity`}>Quantity</FormLabel>
                  <Input
                    id={`tickets.${index}.quantity`}
                    type="number"
                    min="1"
                    value={ticket.quantity}
                    onChange={(e) => updateTicket(index, "quantity", Number.parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div>
                <FormLabel htmlFor={`tickets.${index}.description`}>Description (Optional)</FormLabel>
                <Textarea
                  id={`tickets.${index}.description`}
                  value={ticket.description || ""}
                  onChange={(e) => updateTicket(index, "description", e.target.value)}
                  placeholder="Describe what's included with this ticket"
                />
              </div>

              <div>
                <FormLabel>Ticket Type</FormLabel>
                <RadioGroup
                  value={ticket.ticketType}
                  onValueChange={(value) => updateTicket(index, "ticketType", value)}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Free" />
                    </FormControl>
                    <FormLabel className="font-normal">Free</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Paid" disabled />
                    </FormControl>
                    <FormLabel className="font-normal text-muted-foreground">Paid (Premium)</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Donation" disabled />
                    </FormControl>
                    <FormLabel className="font-normal text-muted-foreground">Donation (Premium)</FormLabel>
                  </FormItem>
                </RadioGroup>
              </div>

              {ticket.ticketType !== "Free" && (
                <div>
                  <FormLabel htmlFor={`tickets.${index}.price`}>Price ($)</FormLabel>
                  <Input
                    id={`tickets.${index}.price`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={ticket.price}
                    onChange={(e) => updateTicket(index, "price", Number.parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}

              {/* Hidden fields for ticketNumber and userId */}
              <input
                type="hidden"
                name={`tickets.${index}.ticketNumber`}
                value={
                  ticket.ticketNumber ||
                  `TKT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().substring(9)}`
                }
              />
              <input type="hidden" name={`tickets.${index}.userId`} value={ticket.userId || session?.user?.id || ""} />
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={addTicket} className="w-full">
          Add Another Ticket Type
        </Button>

        <FormField
          control={form.control}
          name="tickets"
          render={() => (
            <FormItem>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* <div className="flex justify-end space-x-4">
          <Button type="submit">Save and Continue</Button>
        </div> */}
      </form>
    </Form>
  )
}
