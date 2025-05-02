"use client"

import { useState } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { motion } from "framer-motion"
import { Calendar, Clock, MapPin, User, TicketIcon, Download, Share2 } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface TicketCardProps {
  ticket: any
  index: number
}

export function TicketCard({ ticket, index }: TicketCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const { toast } = useToast()

  // Generate a unique ticket number based on user ID and event ID
  const ticketNumber = `TIX-${ticket._id.toString().substring(0, 4)}-${Date.now().toString().substring(9, 13)}`

  const formatDate = (dateString: string) => {
    if (!dateString) return "Date not specified"
    try {
      return format(new Date(dateString), "PPP")
    } catch (error) {
      return "Invalid date"
    }
  }

  const getTicketTypeColor = () => {
    switch (ticket.ticketType) {
      case "attendee":
        return "bg-emerald-500/20 text-emerald-600 border-emerald-500/30"
      case "volunteer":
        return "bg-amber-500/20 text-amber-600 border-amber-500/30"
      case "speaker":
        return "bg-secondary/20 text-secondary border-secondary/30"
      default:
        return "bg-primary/20 text-primary border-primary/30"
    }
  }

  const getTicketTypeIcon = () => {
    switch (ticket.ticketType) {
      case "attendee":
        return <User className="h-4 w-4" />
      case "volunteer":
        return <User className="h-4 w-4" />
      case "speaker":
        return <User className="h-4 w-4" />
      default:
        return <TicketIcon className="h-4 w-4" />
    }
  }

  const handleDownload = () => {
    toast({
      title: "Download started",
      description: "Your ticket is being prepared for download.",
    })
    // In a real implementation, this would generate and download a PDF ticket
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Ticket for ${ticket.title}`,
          text: `Check out my ticket for ${ticket.title}!`,
          url: `${window.location.origin}/events/${ticket.slug || ticket._id}`,
        })
        .catch((error) => {
          toast({
            title: "Sharing failed",
            description: "Could not share this ticket.",
            variant: "destructive",
          })
        })
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(`${window.location.origin}/events/${ticket.slug || ticket._id}`)
      toast({
        title: "Link copied",
        description: "Event link copied to clipboard!",
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="w-full"
    >
      <div className="perspective-1000 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={cn("relative transition-all duration-500 preserve-3d", isFlipped ? "rotate-y-180" : "")}>
          {/* Front of ticket */}
          <Card className="overflow-hidden border-2 shadow-md backface-hidden">
            <div className="h-2 w-full bg-gradient-to-r from-primary to-secondary" />
            <div className="relative h-32 w-full">
              <Image
                src={ticket.image || "/community-celebration.png"}
                alt={ticket.title}
                fill
                className="object-cover"
                onError={(e) => {
                  // @ts-ignore - fallback to default image
                  e.target.src = "/community-celebration.png"
                }}
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <h3 className="text-white text-xl font-bold px-4 text-center">{ticket.title}</h3>
              </div>
              <Badge className={cn("absolute top-2 right-2", getTicketTypeColor())}>
                {ticket.ticketType.charAt(0).toUpperCase() + ticket.ticketType.slice(1)}
              </Badge>
            </div>

            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm font-medium">
                      {formatDate(ticket.date)}
                      {ticket.endDate && ` - ${formatDate(ticket.endDate)}`}
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
                      {ticket.startTime || "Not specified"}
                      {ticket.endTime && ` - ${ticket.endTime}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm font-medium">{ticket.venue || ticket.location || "Location not specified"}</p>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Ticket #</p>
                <p className="text-sm font-mono font-medium">{ticketNumber}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDownload()
                  }}
                >
                  <Download className="h-4 w-4 mr-1" />
                  <span className="sr-only md:not-sr-only">Download</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleShare()
                  }}
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  <span className="sr-only md:not-sr-only">Share</span>
                </Button>
              </div>
            </CardFooter>
          </Card>

          {/* Back of ticket */}
          <Card className="absolute inset-0 overflow-hidden border-2 shadow-md backface-hidden rotate-y-180">
            <div className="h-2 w-full bg-gradient-to-r from-secondary to-primary" />
            <CardContent className="p-4 flex flex-col items-center justify-center h-full">
              <div className="w-48 h-48 bg-white p-2 rounded-md flex items-center justify-center mb-4">
                {/* This would be a real QR code in production */}
                <div className="w-full h-full border-2 border-black grid grid-cols-5 grid-rows-5">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn("border border-black/10", Math.random() > 0.6 ? "bg-black" : "bg-white")}
                    />
                  ))}
                </div>
              </div>

              <div className="text-center">
                <h3 className="font-bold">{ticket.title}</h3>
                <p className="text-sm text-muted-foreground">{formatDate(ticket.date)}</p>
                <p className="text-xs mt-2">Scan this QR code at the event entrance</p>
              </div>

              <div className="mt-4 pt-4 border-t w-full text-center">
                <p className="text-xs text-muted-foreground">Ticket #</p>
                <p className="font-mono">{ticketNumber}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <p className="text-xs text-center mt-1 text-muted-foreground">Click to flip</p>
    </motion.div>
  )
}
