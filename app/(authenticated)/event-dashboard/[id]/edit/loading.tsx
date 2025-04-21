import { Skeleton } from "@/components/ui/skeleton"

export default function EditEventLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-9 w-36" />
      </div>

      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      <div className="space-y-6">
        <Skeleton className="h-96 w-full rounded-lg" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}
