"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DebugAdminEventsPage() {
  const [debugData, setDebugData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchDebugData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/debug/admin-events")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}`)
      }

      setDebugData(data)
    } catch (err) {
      console.error("Debug fetch error:", err)
      setError(err.message || "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebugData()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Admin Events API Debug</CardTitle>
          <Button onClick={fetchDebugData} disabled={loading}>
            {loading ? "Loading..." : "Refresh Data"}
          </Button>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="p-4 bg-red-50 text-red-800 rounded-md">
              <h3 className="font-bold">Error</h3>
              <p>{error}</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : debugData ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Authentication</h3>
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
                  {JSON.stringify(debugData.auth, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Database Counts</h3>
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
                  {JSON.stringify(debugData.counts, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Sample Event</h3>
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
                  {JSON.stringify(debugData.sampleEvent, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">No debug data available</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
