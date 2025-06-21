import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function SpeakersLoading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        {/* Optional: Add a skeleton for a button like "Add Speaker" if planned */}
        {/* <Skeleton className="h-10 w-32" /> */}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array(8)
          .fill(0)
          .map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="flex items-center p-6">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="ml-4 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <div className="flex items-center mt-1 space-x-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </Card>
          ))}
      </div>
    </div>
  )
}