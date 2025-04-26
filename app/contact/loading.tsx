import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ContactPageLoading() {
  return (
    <div className="container mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-6 w-full max-w-2xl mx-auto mt-6" />
        </div>

        <div className="grid grid-cols-1 gap-y-16 md:grid-cols-5 md:gap-x-12">
          <div className="md:col-span-2 space-y-8">
            <div>
              <Skeleton className="h-8 w-32 mb-4" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-6 w-3/4" />
            </div>

            <div>
              <Skeleton className="h-8 w-32 mb-4" />
              <Skeleton className="h-6 w-48" />
            </div>

            <div>
              <Skeleton className="h-8 w-32 mb-4" />
              <Skeleton className="h-6 w-36" />
            </div>

            <div className="py-4">
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          </div>

          <Card className="md:col-span-3 p-8">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-32 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
