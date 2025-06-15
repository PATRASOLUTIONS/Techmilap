import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function EventsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-16">
        <div className="container mx-auto py-8 px-4 md:px-6">
          {/* Header Section Skeleton */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <Skeleton className="h-9 w-64 mb-2" /> {/* "Discover Events" title */}
              <Skeleton className="h-5 w-80" />    {/* Subtitle paragraph */}
            </div>
            {/* EventFilterControls Skeleton */}
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Skeleton className="h-10 w-full sm:w-48" /> {/* Search input */}
              <Skeleton className="h-10 w-full sm:w-40" /> {/* Category select */}
            </div>
          </div>

          {/* Event List Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden border-none shadow-md h-full">
                <div className="relative aspect-video overflow-hidden">
                  <Skeleton className="h-full w-full" />
                </div>
                <CardContent className="p-5">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <div className="space-y-2 mt-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Skeleton */}
          <div className="flex justify-center items-center gap-2 mt-8">
            <Skeleton className="h-10 w-10 rounded-md" /> {/* Prev button */}
            <Skeleton className="h-6 w-24 rounded-md" />  {/* Page x of y */}
            <Skeleton className="h-10 w-10 rounded-md" /> {/* Next button */}
          </div>
        </div>
      </div>
    </div>
  )
}
