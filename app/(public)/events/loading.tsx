import { EventListSkeleton } from "@/components/events/event-list-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="pt-16">
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-10 w-[200px]" />
            <Skeleton className="h-10 w-[150px]" />
          </div>
        </div>

        {/* Upcoming Events Section */}
        <Skeleton className="h-8 w-48 mt-8 mb-4" />
        <EventListSkeleton count={3} />

        {/* Running Events Section */}
        <Skeleton className="h-8 w-48 mt-8 mb-4" />
        <EventListSkeleton count={3} />

        {/* Past Events Section */}
        <Skeleton className="h-8 w-48 mt-8 mb-4" />
        <EventListSkeleton count={3} />
      </div>
    </div>
  )
}
