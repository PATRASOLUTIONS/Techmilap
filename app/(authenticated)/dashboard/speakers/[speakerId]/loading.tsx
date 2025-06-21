import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function SpeakerDetailLoading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" /> {/* Back button */}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-40" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Separator />
          <div>
            <Skeleton className="h-6 w-40 mb-3" />
            <div className="space-y-3">
              {Array(2)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="p-3 border rounded-md">
                    <Skeleton className="h-5 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
            </div>
            <Skeleton className="h-4 w-28 mt-3" /> {/* No events message */}
          </div>

          <Separator />

          <div>
            <Skeleton className="h-6 w-32 mb-3" />
            <div className="space-y-3">
              {Array(1)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="p-3 border rounded-md">
                    <Skeleton className="h-5 w-20 mb-1" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2 mt-1" />
                  </div>
                ))}
            </div>
            <Skeleton className="h-4 w-28 mt-3" /> {/* No reviews message */}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
