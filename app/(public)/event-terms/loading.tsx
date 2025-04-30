import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-8">
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-12 w-3/4 mb-8" />

        <div className="space-y-6">
          <Skeleton className="h-6 w-1/3 mb-6" />

          <Skeleton className="h-24 w-full mb-8" />

          <div className="space-y-4">
            <Skeleton className="h-8 w-1/2 mb-4" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </div>

          <div className="space-y-4">
            <Skeleton className="h-8 w-1/2 mb-4" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
          </div>

          <div className="space-y-4">
            <Skeleton className="h-8 w-1/2 mb-4" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-4/5" />
          </div>

          <div className="space-y-4">
            <Skeleton className="h-8 w-1/2 mb-4" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  )
}
