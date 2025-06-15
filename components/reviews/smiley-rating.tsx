"use client"

import { useState } from "react"
import { Angry, Frown, Meh, Smile, Laugh } from "lucide-react"
import { cn } from "@/lib/utils"

interface SmileyRatingProps {
  rating: number
  onRatingChange: (rating: number) => void
  size?: number
  className?: string
}

const icons = [
  { icon: Angry, color: "text-red-500", hoverColor: "hover:text-red-600" },
  { icon: Frown, color: "text-orange-500", hoverColor: "hover:text-orange-600" },
  { icon: Meh, color: "text-yellow-500", hoverColor: "hover:text-yellow-600" },
  { icon: Smile, color: "text-lime-500", hoverColor: "hover:text-lime-600" },
  { icon: Laugh, color: "text-green-500", hoverColor: "hover:text-green-600" },
]

export function SmileyRating({ rating, onRatingChange, size = 24, className }: SmileyRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)

  return (
    <div className={cn("flex space-x-1", className)}>
      {[1, 2, 3, 4, 5].map((index) => {
        const currentRating = hoverRating || rating
        const IconComponent = icons[index - 1].icon
        const iconColor = currentRating >= index ? icons[index - 1].color : "text-gray-300"
        const hoverEffectColor = icons[index - 1].hoverColor

        return (
          <button
            key={index}
            type="button"
            className={cn(
              "cursor-pointer transition-colors duration-150",
              iconColor,
              hoverEffectColor,
            )}
            onClick={() => onRatingChange(index)}
            onMouseEnter={() => setHoverRating(index)}
            onMouseLeave={() => setHoverRating(0)}
            aria-label={`Rate ${index} out of 5`}
          >
            <IconComponent size={size} />
          </button>
        )
      })}
    </div>
  )
}
