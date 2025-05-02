"use client"

import { Star } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface ReviewStatsProps {
  stats: {
    total: number
    average: number
    pending: number
    approved: number
    rejected: number
    ratings?: {
      1: number
      2: number
      3: number
      4: number
      5: number
    }
  }
}

export function ReviewStats({ stats }: ReviewStatsProps) {
  const ratings = stats.ratings || {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  }

  // Calculate percentages for the rating distribution
  const totalRatings = stats.approved || 1 // Avoid division by zero
  const ratingPercentages = {
    5: (ratings[5] / totalRatings) * 100,
    4: (ratings[4] / totalRatings) * 100,
    3: (ratings[3] / totalRatings) * 100,
    2: (ratings[2] / totalRatings) * 100,
    1: (ratings[1] / totalRatings) * 100,
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">{stats.average.toFixed(1)}</h3>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.round(stats.average) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-muted-foreground">Based on {stats.approved} approved reviews</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Reviews</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded-lg bg-muted p-3">
            <div className="text-2xl font-bold">{stats.pending}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <div className="text-2xl font-bold">{stats.approved}</div>
            <div className="text-xs text-muted-foreground">Approved</div>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <div className="text-2xl font-bold">{stats.rejected}</div>
            <div className="text-xs text-muted-foreground">Rejected</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {[5, 4, 3, 2, 1].map((rating) => (
          <div key={rating} className="flex items-center gap-2">
            <div className="flex items-center w-12">
              <span>{rating}</span>
              <Star className="h-4 w-4 ml-1 text-yellow-400 fill-yellow-400" />
            </div>
            <Progress value={ratingPercentages[rating]} className="h-2" />
            <div className="w-12 text-right text-sm text-muted-foreground">{ratings[rating] || 0}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
