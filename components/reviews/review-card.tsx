"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { formatDistanceToNow } from "date-fns"
import { Star, ThumbsUp, Flag, MoreVertical, MessageSquare, Trash, Edit, Check, X } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface ReviewCardProps {
  review: any
  onReply?: (id: string, text: string) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onEdit?: (id: string) => void
  onApprove?: (id: string) => Promise<void>
  onReject?: (id: string) => Promise<void>
  showEventDetails?: boolean
}

export function ReviewCard({
  review,
  onReply,
  onDelete,
  onEdit,
  onApprove,
  onReject,
  showEventDetails = false,
}: ReviewCardProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [replyText, setReplyText] = useState("")
  const [isReplying, setIsReplying] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showReplyActions, setShowReplyActions] = useState(false)

  // Handle case where review is undefined or null
  if (!review) {
    return null
  }

  // Safely extract userId from review
  const reviewUserId = review.userId?._id || review.userId
  const sessionUserId = session?.user?.id

  const isOwner = reviewUserId && sessionUserId && reviewUserId.toString() === sessionUserId.toString()
  const isEventPlanner = session?.user?.role === "event-planner"
  const isAdmin = session?.user?.role === "super-admin"
  const canModerate = isEventPlanner || isAdmin
  const canReply = canModerate && onReply

  const handleReply = async () => {
    if (!replyText.trim()) {
      toast({
        title: "Error",
        description: "Reply cannot be empty",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await onReply?.(review._id, replyText)
      setReplyText("")
      setIsReplying(false)
      toast({
        title: "Success",
        description: "Your reply has been posted",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this review?")) return

    try {
      await onDelete?.(review._id)
      toast({
        title: "Success",
        description: "Review deleted successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    }
  }

  const handleApprove = async () => {
    try {
      await onApprove?.(review._id)
      toast({
        title: "Success",
        description: "Review approved successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    }
  }

  const handleReject = async () => {
    try {
      await onReject?.(review._id)
      toast({
        title: "Success",
        description: "Review rejected successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    }
  }

  // Format the date
  const formattedDate = review.createdAt
    ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })
    : "recently"

  // Format the reply date if it exists
  const formattedReplyDate = review.reply?.createdAt
    ? formatDistanceToNow(new Date(review.reply.createdAt), { addSuffix: true })
    : ""

  return (
    <Card
      className={cn(
        "w-full transition-all duration-200",
        review.status === "pending" && "border-orange-300 bg-orange-50/30",
        review.status === "rejected" && "border-red-300 bg-red-50/30",
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start space-x-4">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={review.userId?.image || "/placeholder.svg?height=40&width=40&query=user"} />
            <AvatarFallback>
              {review.userId?.name?.charAt(0) || review.userId?.firstName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-medium">
              {review.userId?.name ||
                `${review.userId?.firstName || ""} ${review.userId?.lastName || ""}`.trim() ||
                "Anonymous User"}
            </h3>
            <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn("h-3 w-3", i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300")}
                  />
                ))}
              </div>
              <span className="mx-1">•</span>
              <span>{formattedDate}</span>

              {showEventDetails && review.event && (
                <>
                  <span className="mx-1">•</span>
                  <Badge variant="outline" className="text-xs font-normal">
                    {review.event.name || review.event.title || "Unknown Event"}
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwner && (
              <>
                <DropdownMenuItem onClick={() => onEdit?.(review._id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-500 focus:text-red-500">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
            {canModerate && review.status === "pending" && (
              <>
                <DropdownMenuItem onClick={handleApprove}>
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleReject}>
                  <Flag className="mr-2 h-4 w-4" />
                  Reject
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="pt-4">
        <h4 className="font-medium mb-2">{review.title}</h4>
        <p className="text-sm text-muted-foreground mb-4">{review.comment}</p>

        {review.reply && (
          <div className="mt-4 pl-4 border-l-2 border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-blue-50">
                Event Organizer Reply
              </Badge>
              <span className="text-xs text-muted-foreground">{formattedReplyDate}</span>
            </div>
            <p className="text-sm">{review.reply.text}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        {canReply && !isReplying && !review.reply && (
          <Button variant="outline" size="sm" className="self-start" onClick={() => setIsReplying(true)}>
            <MessageSquare className="mr-2 h-4 w-4" /> Reply to Review
          </Button>
        )}

        {isReplying && (
          <div className="w-full space-y-2">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your reply here..."
              onFocus={() => setShowReplyActions(true)}
              className="w-full"
            />
            {showReplyActions && (
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsReplying(false)
                    setReplyText("")
                    setShowReplyActions(false)
                  }}
                >
                  <X className="mr-1 h-4 w-4" /> Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleReply}
                  disabled={isSubmitting || !replyText.trim()}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  {isSubmitting ? (
                    "Posting..."
                  ) : (
                    <>
                      <Check className="mr-1 h-4 w-4" /> Post Reply
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {review.status !== "approved" && review.status && canModerate && (
          <div className="w-full flex justify-between items-center">
            <Badge
              variant={review.status === "pending" ? "outline" : "secondary"}
              className={cn(
                review.status === "pending" && "border-orange-300 bg-orange-50 text-orange-700",
                review.status === "rejected" && "border-red-300 bg-red-50 text-red-700",
              )}
            >
              {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
            </Badge>

            {review.status === "pending" && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReject}
                  className="border-red-200 hover:bg-red-50 text-red-600"
                >
                  <X className="mr-1 h-3 w-3" /> Reject
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApprove}
                  className="border-green-200 hover:bg-green-50 text-green-600"
                >
                  <Check className="mr-1 h-3 w-3" /> Approve
                </Button>
              </div>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
