import { EventListSkeleton } from "@/components/events/event-list-skeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Filters section */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
          {/* Search input */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10" />
            <Skeleton className="h-10 w-full absolute" />
            <Input disabled type="search" placeholder="Search events..." className="pl-8 opacity-0" />
          </div>

          {/* Category filter */}
          <div className="flex-1 min-w-[150px]">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>

      {/* Events grid */}
      <EventListSkeleton count={6} />
    </div>
  )
}
