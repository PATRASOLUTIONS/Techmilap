"use client"
import { ReviewCard } from "@/components/reviews/review-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface ReviewListProps {
  reviews: any[]
  loading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onDelete?: (id: string) => Promise<void>
  onEdit?: (id: string) => void
  onReply?: (id: string, text: string) => Promise<void>
  onApprove?: (id: string) => Promise<void>
  onReject?: (id: string) => Promise<void>
  showEventDetails?: boolean
}

export function ReviewList({
  reviews,
  loading,
  page,
  totalPages,
  onPageChange,
  onDelete,
  onEdit,
  onReply,
  onApprove,
  onReject,
  showEventDetails = false,
}: ReviewListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No reviews found</p>
      </div>
    )
  }

  console.log("Reviews in list:", reviews.slice(0, 2))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        {reviews.map((review) => (
          <ReviewCard
            key={review._id}
            review={review}
            onDelete={onDelete}
            onEdit={onEdit}
            onReply={onReply}
            onApprove={onApprove}
            onReject={onReject}
            showEventDetails={showEventDetails}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onPageChange(page - 1)} disabled={page === 1 || loading} size="sm">
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <Button
                key={pageNum}
                variant={pageNum === page ? "default" : "outline"}
                onClick={() => onPageChange(pageNum)}
                disabled={loading}
                size="sm"
              >
                {pageNum}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages || loading}
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
