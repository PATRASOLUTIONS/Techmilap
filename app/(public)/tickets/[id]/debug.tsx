"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function TicketDebug({ params }: { params: { id: string } }) {
  const [ticketData, setTicketData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTicketData() {
      try {
        setLoading(true)
        const response = await fetch(`/api/tickets/${params.id}/public`)

        if (!response.ok) {
          throw new Error(`Failed to fetch ticket: ${response.status}`)
        }

        const data = await response.json()
        setTicketData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchTicketData()
  }, [params.id])

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Ticket Debug View</h1>
      <p className="mb-4 text-gray-500">Ticket ID: {params.id}</p>

      {loading ? (
        <div className="p-4 bg-gray-100 rounded">Loading ticket data...</div>
      ) : error ? (
        <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded">
            <h2 className="font-bold mb-2">Raw Ticket Data</h2>
            <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-96">
              {JSON.stringify(ticketData, null, 2)}
            </pre>
          </div>

          <div className="p-4 bg-gray-100 rounded">
            <h2 className="font-bold mb-2">Form Data Fields</h2>
            {ticketData?.ticket?.formData ? (
              <ul className="list-disc pl-5">
                {Object.entries(ticketData.ticket.formData).map(([key, value]) => (
                  <li key={key}>
                    <strong>{key}:</strong> {String(value)}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No form data available</p>
            )}
          </div>

          <Button onClick={() => window.history.back()}>Back to Ticket</Button>
        </div>
      )}
    </div>
  )
}
