"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, MapPin, Globe, Ticket, HelpCircle, CheckCircle2, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"

export function EventPreview({ formData }) {
  const { details, tickets, customQuestions } = formData

  const formatDate = (dateString) => {
    if (!dateString) return "Not set"
    try {
      return format(new Date(dateString), "PPP")
    } catch (error) {
      console.error("Date formatting error:", error)
      return "Invalid date"
    }
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

  const getTicketTypeColor = (type) => {
    switch (type) {
      case "Early Bird":
        return "bg-blue-500/10 text-blue-500"
      case "General Admission":
        return "bg-primary/10 text-primary"
      case "VIP":
        return "bg-purple-500/10 text-purple-500"
      case "Student":
        return "bg-green-500/10 text-green-500"
      default:
        return "bg-primary/10 text-primary"
    }
  }

  const getPricingModelColor = (model) => {
    switch (model) {
      case "Free":
        return "bg-green-500/10 text-green-500"
      case "Paid":
        return "bg-blue-500/10 text-blue-500"
      case "Donation":
        return "bg-amber-500/10 text-amber-500"
      default:
        return "bg-primary/10 text-primary"
    }
  }

  // Get the event URL (slug or fallback to ID)
  const getEventUrl = (event) => {
    return details.slug || details.id || ""
  }

  console.log("Preview formData:", formData)

  return (
    <motion.div className="space-y-8" variants={container} initial="hidden" animate="show">
      <motion.div className="flex items-center gap-3" variants={item}>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Event Preview
        </h2>
      </motion.div>

      <motion.div variants={item}>
        <Card className="border overflow-hidden">
          <div className="h-40 bg-gradient-to-r from-primary/20 to-secondary/20 relative">
            {details.coverImageUrl ? (
              <img
                src={details.coverImageUrl || "/placeholder.svg"}
                alt={details.name || "Event cover"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "/placeholder.svg?key=antfj"
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                {details.name ? (
                  <h1 className="text-3xl font-bold text-center px-4 py-2 bg-background/80 backdrop-blur-sm rounded-lg shadow-sm">
                    {details.name}
                  </h1>
                ) : (
                  <div className="text-center px-4 py-2 bg-background/80 backdrop-blur-sm rounded-lg shadow-sm">
                    <p className="text-muted-foreground">Cover image will appear here</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                    {details.name || "Event Name"}
                  </h1>
                  <Badge
                    className={cn(
                      "px-3 py-1",
                      details.type === "Online"
                        ? "bg-blue-500/10 text-blue-500"
                        : details.type === "Hybrid"
                          ? "bg-purple-500/10 text-purple-500"
                          : "bg-primary/10 text-primary",
                    )}
                  >
                    {details.type || "Event Type"}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{details.displayName || "Event Display Name"}</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="overflow-hidden border-0 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/20 pb-2">
                    <CardTitle className="text-lg">Event Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Date</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(details.startDate)} {details.endDate && `to ${formatDate(details.endDate)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center mt-0.5">
                        <Clock className="h-4 w-4 text-secondary" />
                      </div>
                      <div>
                        <p className="font-medium">Time</p>
                        <p className="text-sm text-muted-foreground">
                          {details.startTime || "00:00"} - {details.endTime || "00:00"}
                        </p>
                      </div>
                    </div>
                    {(details.type === "Offline" || details.type === "Hybrid") && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Venue</p>
                          <p className="text-sm text-muted-foreground">{details.venue || "Venue Name"}</p>
                          <p className="text-sm text-muted-foreground">{details.address || "Venue Address"}</p>
                        </div>
                      </div>
                    )}
                    {(details.type === "Online" || details.type === "Hybrid") && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center mt-0.5">
                          <Globe className="h-4 w-4 text-secondary" />
                        </div>
                        <div>
                          <p className="font-medium">Online Platform</p>
                          <p className="text-sm text-muted-foreground">
                            Online meeting details will be shared with attendees
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-0 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-secondary/5 to-secondary/20 pb-2">
                    <CardTitle className="text-lg">Event Description</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {details.description ? (
                      <div className="prose max-w-none">
                        <ReactMarkdown>{details.description}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center h-full">
                        <p className="text-muted-foreground">No description provided.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Ticket className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold">Tickets</h2>
                </div>
                {tickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted rounded-md text-center">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                      <Ticket className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No tickets have been created yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tickets.map((ticket) => (
                      <Card
                        key={ticket.id}
                        className={cn(
                          "overflow-hidden border-0 shadow-md transition-all hover:shadow-lg",
                          ticket.pricingModel === "Free"
                            ? "bg-gradient-to-br from-green-500/5 to-green-500/10"
                            : "bg-gradient-to-br from-primary/5 to-secondary/10",
                        )}
                      >
                        <CardHeader className="pb-2 relative">
                          <div className="absolute top-0 right-0 m-2">
                            <Badge
                              variant="outline"
                              className={cn("px-2 py-0.5", getPricingModelColor(ticket.pricingModel))}
                            >
                              {ticket.pricingModel}
                            </Badge>
                          </div>
                          <div className="pt-6">
                            <CardTitle>{ticket.name || `Ticket #${ticket.id}`}</CardTitle>
                            <CardDescription>{ticket.type}</CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 p-4">
                          {ticket.pricingModel === "Paid" && (
                            <div className="flex justify-between">
                              <span className="font-medium">Price:</span>
                              <span className="font-bold text-primary">${ticket.price || "0.00"}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="font-medium">Quantity:</span>
                            <span>{ticket.quantity || "0"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Sale Period:</span>
                            <span className="text-right text-sm">
                              {formatDate(ticket.saleStartDate)} to {formatDate(ticket.saleEndDate)}
                            </span>
                          </div>
                          {ticket.pricingModel === "Paid" && (
                            <div className="flex justify-between">
                              <span className="font-medium">Fees paid by:</span>
                              <span>{ticket.feeStructure}</span>
                            </div>
                          )}
                          <div className="pt-2">
                            <Button
                              variant="outline"
                              className="w-full button-hover"
                              disabled={!ticket.name || !ticket.quantity}
                            >
                              {ticket.pricingModel === "Free" ? "Register" : "Purchase"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {customQuestions && customQuestions.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                        <HelpCircle className="h-4 w-4 text-secondary" />
                      </div>
                      <h2 className="text-lg font-bold">Custom Questions</h2>
                    </div>
                    <Card className="overflow-hidden border-0 shadow-md">
                      <CardHeader className="bg-gradient-to-r from-secondary/5 to-secondary/20 pb-2">
                        <CardTitle className="text-lg">Registration Form</CardTitle>
                        <CardDescription>
                          Attendees will be asked to answer these questions during registration
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 p-4">
                        {customQuestions.map((question) => (
                          <div key={question.id} className="space-y-2 p-4 border rounded-md bg-muted/20">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{question.question || `Question #${question.id}`}</h3>
                              {question.required && (
                                <Badge variant="outline" className="text-destructive bg-destructive/10">
                                  <AlertCircle className="mr-1 h-3 w-3" />
                                  Required
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">Type: {question.type}</p>
                            {["SingleChoice", "MultipleChoice", "Dropdown"].includes(question.type) && (
                              <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium">Options:</p>
                                {question.options?.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">No options defined</p>
                                ) : (
                                  <ul className="ml-4 space-y-1">
                                    {question.options?.map((option) => (
                                      <li key={option.id} className="flex items-center gap-2 text-sm">
                                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                                        <span>{option.value || `Option ${option.id}`}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              <div className="flex justify-center mt-8">
                <div className="p-4 rounded-lg bg-muted/30 border max-w-md text-center">
                  <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="text-lg font-medium">Ready to Go Live?</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Your event looks great! Review all details before publishing.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
