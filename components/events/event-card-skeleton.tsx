import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function EventCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <Card
      className="overflow-hidden flex flex-col h-full transition-opacity duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Image placeholder */}
      <div className="relative">
        <Skeleton className="h-48 w-full rounded-b-none" />
        {/* Date badge placeholder */}
        <div className="absolute top-4 right-4">
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </div>

      <CardHeader className="pb-2">
        {/* Title */}
        <Skeleton className="h-6 w-3/4 mb-2" />
        {/* Location */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardHeader>

      <CardContent className="pb-2 flex-grow">
        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Category and attendees */}
        <div className="mt-4 flex items-center justify-between">
          <Skeleton className="h-6 w-20 rounded-full" />
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-6 rounded-full border-2 border-background" />
              ))}
            </div>
            <Skeleton className="h-4 w-12 ml-2" />
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  )
}
