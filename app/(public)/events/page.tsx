import { Suspense } from "react"
import { PublicEventList } from "@/components/events/public-event-list"
import { EventFilters } from "@/components/events/event-filters"
import { LandingHeader } from "@/components/landing/landing-header"

export default function EventsPage() {
  return (
    <>
      <LandingHeader />
      <div className="container mx-auto py-16 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Discover Events</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Browse through our collection of upcoming events and find the perfect one for you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <EventFilters />
          </div>
          <div className="lg:col-span-3">
            <Suspense fallback={<div>Loading events...</div>}>
              <PublicEventList />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  )
}
