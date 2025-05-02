"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  readOnly?: boolean
  size?: number
  className?: string
}

export function StarRating({ rating, onRatingChange, readOnly = false, size = 20, className }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)

  const handleMouseEnter = (index: number) => {
    if (readOnly) return
    setHoverRating(index)
  }

  const handleMouseLeave = () => {
    if (readOnly) return
    setHoverRating(0)
  }

  const handleClick = (index: number) => {
    if (readOnly) return
    onRatingChange?.(index)
  }

  return (
    <div className={cn("flex", className)}>
      {[1, 2, 3, 4, 5].map((index) => {
        const filled = hoverRating ? index <= hoverRating : index <= rating

        return (
          <Star
            key={index}
            size={size}
            className={cn(
              "cursor-pointer transition-colors",
              filled ? "fill-yellow-400 text-yellow-400" : "text-gray-300",
              readOnly && "cursor-default",
            )}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(index)}
          />
        )
      })}
    </div>
  )
}
