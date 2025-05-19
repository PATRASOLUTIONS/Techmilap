"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export default function EventError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Event page error:", error)
  }, [error])

  return (
    <div className="container mx-auto py-12 px-4 md:px-6 text-center">
      <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
      <p className="mb-6">We couldn't load this event. Please try again later.</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={reset} variant="outline">
          Try again
        </Button>
        <Button asChild>
          <Link href="/events">Back to Events</Link>
        </Button>
      </div>
    </div>
  )
}
