import { EventListSkeleton } from "@/components/events/event-list-skeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function Loading() {
  return (
    <div className="pt-16">
      <div className="container mx-auto py-8 px-4 md:px-6">
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            {/* Search input */}
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10" />
              <Skeleton className="h-10 w-full absolute" />
              <Input disabled type="search" placeholder="Search events..." className="pl-8 opacity-0" />
            </div>

            {/* Category filter */}
            <div className="flex-1 min-w-[150px]">
              <Skeleton className="h-10 w-full" />
              <div className="mt-2">
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Events Section */}
        <div className="mb-12">
          <Skeleton className="h-8 w-48 mt-8 mb-4" />
          <EventListSkeleton count={3} />
        </div>

        {/* Running Events Section */}
        <div className="mb-12">
          <Skeleton className="h-8 w-48 mt-8 mb-4" />
          <EventListSkeleton count={3} />
        </div>

        {/* Past Events Section */}
        <div>
          <Skeleton className="h-8 w-48 mt-8 mb-4" />
          <EventListSkeleton count={3} />
        </div>
      </div>
    </div>
  )
}
