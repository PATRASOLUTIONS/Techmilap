import { EventListSkeleton } from "@/components/events/event-list-skeleton"

export default function ExploreLoading() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Explore Events</h1>
        <p className="text-muted-foreground">Discovering events for you...</p>
      </div>

      <div className="h-10 w-full max-w-sm rounded-md bg-muted/60 animate-pulse" />

      <EventListSkeleton count={6} />
    </div>
  )
}
