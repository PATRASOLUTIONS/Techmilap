import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function FormsCustomizeLoading() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center space-x-2 mb-6">
        <Button variant="outline" size="icon" disabled>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <Skeleton className="h-8 w-64 mb-1" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
