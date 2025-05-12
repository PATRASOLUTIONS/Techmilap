"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Users, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface CheckInStatsProps {
  eventId: string
  refreshInterval?: number
}

export function CheckInStats({ eventId, refreshInterval = 30000 }: CheckInStatsProps) {
  const [stats, setStats] = useState<any>(null)
  const [recentCheckIns, setRecentCheckIns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/check-ins/stats`, {
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch check-in stats")
      }

      const data = await response.json()
      setStats(data.stats)
      setRecentCheckIns(data.recentCheckIns || [])
      setError(null)
    } catch (err: any) {
      console.error("Error fetching check-in stats:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()

    // Set up polling for real-time updates
    const interval = setInterval(fetchStats, refreshInterval)

    return () => clearInterval(interval)
  }, [eventId, refreshInterval])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Check-in Statistics</CardTitle>
          <CardDescription>Loading check-in data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-24 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Check-in Statistics</CardTitle>
          <CardDescription>Error loading check-in data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Check-in Statistics</CardTitle>
          <CardDescription>Real-time attendance tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-sm text-blue-700">Total Attendees</div>
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-sm text-green-700">Checked In</div>
                <div className="text-2xl font-bold">{stats?.checkedIn || 0}</div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-lg p-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-500" />
              <div>
                <div className="text-sm text-amber-700">Remaining</div>
                <div className="text-2xl font-bold">{stats?.remaining || 0}</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Check-in Progress</span>
              <span className="font-medium">{stats?.percentage || 0}%</span>
            </div>
            <Progress value={stats?.percentage || 0} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {recentCheckIns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Check-ins</CardTitle>
            <CardDescription>Latest attendees who checked in</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentCheckIns.map((checkIn) => (
                <div key={checkIn.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Checked In
                    </Badge>
                    <div>
                      <div className="font-medium">{checkIn.name}</div>
                      <div className="text-xs text-gray-500">{checkIn.email}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(checkIn.checkedInAt), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
