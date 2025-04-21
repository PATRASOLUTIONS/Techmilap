import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function CreateEventLoading() {
  return (
    <div className="container py-10">
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>

        <Card>
          <div className="h-2 w-full bg-muted" />
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="flex space-x-2">
                  {[1, 2, 3, 4].map((step) => (
                    <Skeleton key={step} className="h-8 w-8 rounded-full" />
                  ))}
                </div>
                <div className="ml-4">
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <div className="grid gap-6 md:grid-cols-2">
                  <Skeleton className="h-40" />
                  <Skeleton className="h-40" />
                </div>
              </div>

              <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <div className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
