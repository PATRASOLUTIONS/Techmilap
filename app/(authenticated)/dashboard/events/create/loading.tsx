import { Skeleton } from "@/components/ui/skeleton"

export default function CreateEventLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-[300px]" />
        <Skeleton className="h-4 w-[500px] mt-2" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-[600px] w-full" />
      </div>
    </div>
  )
}
