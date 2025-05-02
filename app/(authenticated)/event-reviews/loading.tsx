import { Skeleton } from "@/components/ui/skeleton"

export default function EventReviewsLoading() {
  return (
    <div className="container mx-auto py-10">
      <Skeleton className="h-12 w-1/3 mb-6" />
      <div className="grid gap-6">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[100px] w-full" />
        <div className="grid gap-4">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-[120px] w-full" />
            ))}
        </div>
      </div>
    </div>
  )
}
