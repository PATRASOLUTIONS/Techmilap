"use client"

import { ReviewCard } from "./review-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ReviewListProps {
  reviews: any[]
  loading?: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onReply?: (id: string, text: string) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onEdit?: (id: string) => void
  onApprove?: (id: string) => Promise<void>
  onReject?: (id: string) => Promise<void>
  showEventDetails?: boolean
}

export function ReviewList({
  reviews,
  loading = false,
  page,
  totalPages,
  onPageChange,
  onReply,
  onDelete,
  onEdit,
  onApprove,
  onReject,
  showEventDetails = false,
}: ReviewListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-[200px] w-full" />
          ))}
      </div>
    )
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium">No reviews found</h3>
        <p className="text-muted-foreground">There are no reviews matching your criteria.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard
            key={review._id}
            review={review}
            onReply={onReply}
            onDelete={onDelete}
            onEdit={onEdit}
            onApprove={onApprove}
            onReject={onReject}
            showEventDetails={showEventDetails}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 py-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm">
            Page {page} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
