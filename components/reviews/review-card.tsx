"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { formatDistanceToNow } from "date-fns"
import { Star, ThumbsUp, Flag, MoreVertical, MessageSquare, Trash, Edit } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

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

  const isOwner = session?.user?.id === review.userId._id
  const isEventPlanner = session?.user?.role === "event-planner"
  const isAdmin = session?.user?.role === "super-admin"
  const canModerate = isEventPlanner || isAdmin

  const handleReply = async () => {
    if (!replyText.trim()) {
      toast({
        title: "Error",
        description: "Reply cannot be empty",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await onReply?.(review._id, replyText)
      setReplyText("")
      setIsReplying(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      await onDelete?.(review._id)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
      })
    }
  }

  const handleApprove = async () => {
    try {
      await onApprove?.(review._id)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
      })
    }
  }

  const handleReject = async () => {
    try {
      await onReject?.(review._id)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
      })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={review.userId?.image || "/placeholder.svg"} />
            <AvatarFallback>{review.userId?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-medium">{review.userId?.name}</h3>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Star className="h-4 w-4" />
              <span>{review.rating}</span>
              <span className="mx-1">•</span>
              <span>{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</span>
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
      <CardContent className="break-words text-sm">
        <p>{review.text}</p>
        {showEventDetails && review.event && <Badge className="mt-2">Reviewed Event: {review.event.name}</Badge>}
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setIsReplying(!isReplying)}>
          <MessageSquare className="mr-2 h-4 w-4" /> Reply
        </Button>
        {review.status !== "approved" && canModerate && <Badge variant="secondary">{review.status}</Badge>}
      </CardFooter>
      {isReplying && (
        <CardFooter className="flex flex-col space-y-2">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write your reply here..."
          />
          <div className="flex justify-end">
            <Button isLoading={isSubmitting} onClick={handleReply} disabled={isSubmitting}>
              Post Reply
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
