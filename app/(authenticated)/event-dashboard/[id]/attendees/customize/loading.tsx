import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Loading() {
  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" disabled>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="h-8 w-64 bg-muted animate-pulse rounded-md"></div>
      </div>
      <div className="h-96 bg-muted animate-pulse rounded-lg"></div>
    </div>
  )
}
