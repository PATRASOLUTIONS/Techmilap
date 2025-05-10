import { Skeleton } from "@/components/ui/skeleton"

export default function TicketLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Status banner skeleton */}
        <Skeleton className="h-12 w-full mb-4 rounded-lg" />

        {/* Main ticket card skeleton */}
        <div className="bg-white rounded-xl overflow-hidden shadow-xl border border-gray-200">
          {/* Ticket header skeleton */}
          <Skeleton className="h-24 w-full" />

          {/* Ticket body skeleton */}
          <div className="p-6">
            {/* Ticket number skeleton */}
            <div className="flex flex-col items-center mb-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-32" />
            </div>

            {/* Time and location skeletons */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <Skeleton className="h-5 w-5 mr-3" />
                <Skeleton className="h-5 w-40" />
              </div>

              <div className="flex items-start">
                <Skeleton className="h-5 w-5 mr-3" />
                <Skeleton className="h-5 w-60" />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-200 my-6"></div>

            {/* Attendee information skeletons */}
            <div className="space-y-4 mb-6">
              <Skeleton className="h-6 w-40" />

              <div className="flex items-center">
                <Skeleton className="h-5 w-5 mr-3" />
                <Skeleton className="h-5 w-40" />
              </div>

              <div className="flex items-center">
                <Skeleton className="h-5 w-5 mr-3" />
                <Skeleton className="h-5 w-60" />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-200 my-6"></div>

            {/* Important note skeleton */}
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>

          {/* Ticket footer skeleton */}
          <div className="bg-gray-50 p-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </div>

        {/* Additional information skeleton */}
        <div className="mt-6 text-center">
          <Skeleton className="h-4 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    </div>
  )
}
