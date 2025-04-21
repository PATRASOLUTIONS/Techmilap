"use client"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, MapPin, QrCode, Ticket, User } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface TicketPreviewProps {
  ticket: any
  eventDetails: any
  selectedDesign?: string
  onSelectDesign?: (design: string) => void
}

export function TicketPreview({ ticket, eventDetails, selectedDesign = "modern", onSelectDesign }: TicketPreviewProps) {
  const handleDesignChange = (design: string) => {
    if (onSelectDesign) {
      onSelectDesign(design)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Not set"
    return format(new Date(dateString), "PPP")
  }

  const formatTime = (timeString) => {
    if (!timeString) return "Not set"
    return timeString
  }

  // Generate a random ticket number for the preview
  const ticketNumber = `TIX-${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")}`

  return (
    <div className="space-y-4">
      <Tabs defaultValue={selectedDesign} onValueChange={handleDesignChange} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Ticket Preview</h3>
          <TabsList className="grid w-full max-w-[400px] grid-cols-3">
            <TabsTrigger value="modern" className="text-xs">
              Modern
            </TabsTrigger>
            <TabsTrigger value="classic" className="text-xs">
              Classic
            </TabsTrigger>
            <TabsTrigger value="minimal" className="text-xs">
              Minimal
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Modern Design */}
        <TabsContent value="modern" className="mt-0">
          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md"
            >
              <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary/5 to-secondary/10">
                <div className="h-2 w-full bg-gradient-to-r from-primary to-secondary" />
                <CardContent className="p-0">
                  <div className="relative">
                    {/* Top Section */}
                    <div className="p-6 pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                            {ticket.name || "Ticket Name"}
                          </h3>
                          <p className="text-sm text-muted-foreground">{ticket.type || "Ticket Type"}</p>
                        </div>
                        <Badge
                          className={cn(
                            "px-3 py-1",
                            ticket.pricingModel === "Free"
                              ? "bg-green-500/10 text-green-500"
                              : ticket.pricingModel === "Donation"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-blue-500/10 text-blue-500",
                          )}
                        >
                          {ticket.pricingModel || "Paid"}
                        </Badge>
                      </div>
                      <div className="mt-4">
                        <h2 className="text-lg font-bold">{eventDetails.name || "Event Name"}</h2>
                        <p className="text-sm text-muted-foreground">{eventDetails.displayName || "Event Display"}</p>
                      </div>
                    </div>

                    {/* Middle Section */}
                    <div className="px-6 py-4 bg-muted/30 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Date</p>
                          <p className="text-sm font-medium">
                            {formatDate(eventDetails.startDate)}{" "}
                            {eventDetails.endDate && `- ${formatDate(eventDetails.endDate)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-secondary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Time</p>
                          <p className="text-sm font-medium">
                            {formatTime(eventDetails.startTime)}{" "}
                            {eventDetails.endTime && `- ${formatTime(eventDetails.endTime)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Location</p>
                          <p className="text-sm font-medium">{eventDetails.venue || "Venue Name"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="p-6 pt-4 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Ticket #</p>
                        <p className="text-sm font-mono font-medium">{ticketNumber}</p>
                      </div>
                      <div className="w-24 h-24 bg-white p-2 rounded-md flex items-center justify-center">
                        <QrCode className="h-full w-full text-primary/80" />
                      </div>
                    </div>

                    {/* Price Tag */}
                    {ticket.pricingModel === "Paid" && ticket.price && (
                      <div className="absolute top-6 right-6 w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold">${Number(ticket.price).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* Classic Design */}
        <TabsContent value="classic" className="mt-0">
          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md"
            >
              <Card className="overflow-hidden border-2 border-primary/20 shadow-md">
                <CardContent className="p-0">
                  {/* Header */}
                  <div className="bg-primary/10 p-4 border-b border-primary/20">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold">{eventDetails.name || "Event Name"}</h2>
                      <Badge variant="outline" className="border-primary/30 bg-background">
                        {ticket.type || "Ticket Type"}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{ticket.name || "Ticket Name"}</h3>
                        <p className="text-sm text-muted-foreground">{ticket.pricingModel || "Paid"} Admission</p>
                      </div>
                      {ticket.pricingModel === "Paid" && ticket.price && (
                        <div className="px-4 py-2 bg-primary/10 rounded-md border border-primary/20">
                          <p className="text-xs text-muted-foreground">Price</p>
                          <p className="text-lg font-bold text-primary">${Number(ticket.price).toFixed(2)}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <p className="text-sm font-medium">Date</p>
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">{formatDate(eventDetails.startDate)}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <p className="text-sm font-medium">Time</p>
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">{formatTime(eventDetails.startTime)}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <p className="text-sm font-medium">Location</p>
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">{eventDetails.venue || "Venue Name"}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          <p className="text-sm font-medium">Attendee</p>
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">[Attendee Name]</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-dashed border-primary/20 p-4 flex justify-between items-center bg-muted/30">
                    <div>
                      <p className="text-xs text-muted-foreground">Ticket #</p>
                      <p className="font-mono text-sm">{ticketNumber}</p>
                    </div>
                    <div className="w-20 h-20 bg-white p-1 rounded-md flex items-center justify-center">
                      <QrCode className="h-full w-full text-primary/80" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* Minimal Design */}
        <TabsContent value="minimal" className="mt-0">
          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md"
            >
              <Card className="overflow-hidden border-0 shadow-md bg-background">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm uppercase tracking-wider text-muted-foreground">
                        {ticket.type || "Ticket Type"}
                      </h3>
                      <h2 className="text-2xl font-bold mt-1">{eventDetails.name || "Event Name"}</h2>
                    </div>
                    <div className="flex flex-col items-end">
                      <Ticket className="h-6 w-6 text-primary mb-1" />
                      {ticket.pricingModel === "Paid" && ticket.price ? (
                        <span className="text-xl font-bold">${Number(ticket.price).toFixed(2)}</span>
                      ) : (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500">
                          {ticket.pricingModel || "Free"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="my-6 border-t border-b py-4 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <Calendar className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="text-sm font-medium">{formatDate(eventDetails.startDate).split(",")[0]}</p>
                    </div>
                    <div className="text-center border-x">
                      <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="text-sm font-medium">{formatTime(eventDetails.startTime)}</p>
                    </div>
                    <div className="text-center">
                      <MapPin className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="text-sm font-medium truncate max-w-[100px] mx-auto">
                        {eventDetails.venue || "Venue"}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{ticket.name || "Ticket Name"}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{ticketNumber}</p>
                    </div>
                    <div className="w-16 h-16 bg-muted/50 p-1 rounded-md flex items-center justify-center">
                      <QrCode className="h-full w-full text-primary/80" />
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t text-center">
                    <p className="text-xs text-muted-foreground">Present this ticket at the entrance for admission</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
