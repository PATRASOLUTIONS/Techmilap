import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function FormLoading({ params }: { params: { id: string } }) {
  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-2">
          <Link href={`/events/${params?.id || ""}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="mb-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}
