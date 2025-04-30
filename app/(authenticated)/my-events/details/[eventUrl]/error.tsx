"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function EventDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Event detail page error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
      <p className="text-muted-foreground mb-6">We encountered an error while loading this event.</p>
      <div className="flex gap-4">
        <Button asChild variant="default">
          <Link href="/my-events">Back to My Events</Link>
        </Button>
        <Button onClick={reset} variant="outline">
          Try Again
        </Button>
      </div>
    </div>
  )
}
