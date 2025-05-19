import Link from "next/link"
import Image from "next/image"
import { CalendarIcon, MapPinIcon, Clock, Users, Tag, Ticket } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

// Static event data that will always work
const staticEvent = {
  title: "Tech Conference 2023",
  description:
    "<p>Join us for an exciting tech conference featuring the latest innovations and networking opportunities.</p>",
  date: "2023-12-15",
  location: "Tech Center, Downtown",
  image: "/vibrant-tech-event.png",
  category: "Technology",
  price: 0,
  tags: ["tech", "networking", "innovation"],
  organizerName: "Tech Events Team",
}

export default function EventPage({ params }: { params: { id: string } }) {
  // Use static data to ensure the page always renders
  const event = staticEvent

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="mb-6">
        <Link href="/events" className="text-primary hover:underline flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          Back to Events
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Event Image */}
          <div className="relative aspect-video overflow-hidden rounded-lg shadow-md bg-gray-100">
            <Image
              src="/vibrant-tech-event.png"
              alt={event.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
            />
          </div>

          {/* Event Details */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>

            {event.category && <Badge className="mb-4 bg-primary text-white">{event.category}</Badge>}

            <div className="prose max-w-none mt-6">
              <div dangerouslySetInnerHTML={{ __html: event.description }} />
            </div>
          </div>

          {/* Tags */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Info Card */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-semibold mb-4">Event Details</h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Date</p>
                    <p>Friday, December 15, 2023</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Time</p>
                    <p>9:00 AM - 5:00 PM</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPinIcon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p>{event.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Organizer</p>
                    <p>{event.organizerName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Ticket className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Price</p>
                    <p>Free</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href={`/events/${params.id}/register`}>Register Now</Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href={`/events/${params.id}/volunteer`}>Volunteer</Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href={`/events/${params.id}/speaker`}>Apply as Speaker</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
