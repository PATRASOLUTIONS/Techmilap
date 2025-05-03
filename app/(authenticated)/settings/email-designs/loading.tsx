import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container py-6 space-y-6">
      <div>
        <Skeleton className="h-10 w-[250px] mb-2" />
        <Skeleton className="h-4 w-[450px]" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-[500px] w-full" />
      </div>
    </div>
  )
}
