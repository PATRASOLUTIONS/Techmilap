import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function EventCardSkeleton() {
  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <Skeleton className="h-48 w-full" />
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="mt-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mt-1" />
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  )
}
