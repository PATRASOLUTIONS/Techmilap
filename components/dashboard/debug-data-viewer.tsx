"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface DebugDataViewerProps {
  eventId: string
}

export function DebugDataViewer({ eventId }: DebugDataViewerProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  async function fetchData() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/events/${eventId}/registrations`)

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`)
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Debug Data Viewer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={fetchData} disabled={loading}>
            {loading ? "Loading..." : "Fetch Raw Data"}
          </Button>

          {error && <div className="p-4 bg-red-50 text-red-700 rounded-md">Error: {error}</div>}

          {data && (
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline">
                  {isOpen ? "Hide" : "Show"} Raw Data ({data.registrations?.length || 0} records)
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-4 bg-gray-50 rounded-md mt-2 overflow-auto max-h-[500px]">
                  <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
