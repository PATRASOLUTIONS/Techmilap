"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Copy, ExternalLink, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

export function EventCreationSuccess({ eventId, eventName, eventSlug, isEditing = false, isPublished = true }) {
  const router = useRouter()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const eventUrl = `${baseUrl}/events/${eventSlug || eventId}`
  const registrationUrl = `${eventUrl}/register`
  const volunteerUrl = `${eventUrl}/volunteer`
  const speakerUrl = `${eventUrl}/speaker`

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast({
      title: "Link copied!",
      description: "The link has been copied to your clipboard.",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleViewEvent = () => {
    router.push(`/event-dashboard/${eventId}`)
  }

  const handleCreateAnother = () => {
    router.push("/dashboard/events/create")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto"
    >
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <div className="flex items-center mb-2">
            <CheckCircle className="h-8 w-8 mr-2" />
            <CardTitle className="text-2xl">Success!</CardTitle>
          </div>
          <CardDescription className="text-white opacity-90 text-lg">
            {isEditing
              ? `Your event "${eventName}" has been updated successfully.`
              : `Your event "${eventName}" has been created successfully.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Event Links</h3>
            <div className="space-y-4">
              <div className="border rounded-md p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Public Event Page</p>
                    <p className="text-sm text-muted-foreground truncate max-w-[300px]">{eventUrl}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(eventUrl)}>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.open(eventUrl, "_blank")}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border rounded-md p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Registration Page</p>
                    <p className="text-sm text-muted-foreground truncate max-w-[300px]">{registrationUrl}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(registrationUrl)}>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.open(registrationUrl, "_blank")}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border rounded-md p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Volunteer Application Page</p>
                    <p className="text-sm text-muted-foreground truncate max-w-[300px]">{volunteerUrl}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(volunteerUrl)}>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.open(volunteerUrl, "_blank")}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border rounded-md p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Speaker Application Page</p>
                    <p className="text-sm text-muted-foreground truncate max-w-[300px]">{speakerUrl}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(speakerUrl)}>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.open(speakerUrl, "_blank")}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!isPublished && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <h4 className="text-amber-800 font-medium">Your event is saved as a draft</h4>
              <p className="text-amber-700 text-sm mt-1">
                You can publish it later from the event dashboard when you're ready.
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-blue-800 font-medium">What's next?</h4>
            <ul className="text-blue-700 text-sm mt-2 space-y-1 list-disc pl-5">
              <li>Customize your event forms from the Event Dashboard</li>
              <li>Share your event link with potential attendees</li>
              <li>Monitor registrations and manage your event</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-6">
          <Button variant="outline" onClick={handleCreateAnother}>
            Create Another Event
          </Button>
          <Button onClick={handleViewEvent} className="button-hover bg-gradient-to-r from-primary to-secondary">
            Go to Event Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
