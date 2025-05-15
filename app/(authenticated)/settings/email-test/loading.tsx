import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function EmailTestLoading() {
  return (
    <div className="container py-10">
      <Skeleton className="h-10 w-64 mb-6" />
      <Skeleton className="h-5 w-full max-w-2xl mb-8" />

      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-5 w-36 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-36" />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-8 w-full mb-4" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Skeleton className="h-10 w-36" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
