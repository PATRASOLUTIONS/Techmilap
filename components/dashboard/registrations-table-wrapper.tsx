"use client"

import { useState, useEffect } from "react"
import { SimpleRegistrationsTable } from "./simple-registrations-table"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface RegistrationsTableWrapperProps {
  eventId: string
}

export function RegistrationsTableWrapper({ eventId }: RegistrationsTableWrapperProps) {
  const [registrations, setRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRegistrations() {
      try {
        setLoading(true)
        setError(null)

        // This is where we fetch the data from the API
        const response = await fetch(`/api/events/${eventId}/registrations`)

        if (!response.ok) {
          throw new Error(`Failed to fetch registrations: ${response.status}`)
        }

        const data = await response.json()
        console.log("Fetched registrations data:", data) // Debug log to see the data structure
        setRegistrations(data.registrations || [])
      } catch (err) {
        console.error("Error fetching registrations:", err)
        setError(err instanceof Error ? err.message : "Failed to load registrations")
      } finally {
        setLoading(false)
      }
    }

    fetchRegistrations()
  }, [eventId])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}. Please try refreshing the page or contact support if the problem persists.
        </AlertDescription>
      </Alert>
    )
  }

  return <SimpleRegistrationsTable registrations={registrations} eventId={eventId} />
}
