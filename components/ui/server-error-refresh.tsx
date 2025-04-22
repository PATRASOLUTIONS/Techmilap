"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ServerErrorRefreshProps {
  message?: string
}

export function ServerErrorRefresh({
  message = "Server error encountered. Attempting to recover...",
}: ServerErrorRefreshProps) {
  const [countdown, setCountdown] = useState(1)

  useEffect(() => {
    // Set a flag in session storage to prevent infinite refresh loops
    const refreshAttempted = sessionStorage.getItem("error_refresh_attempted")

    if (!refreshAttempted) {
      sessionStorage.setItem("error_refresh_attempted", "true")

      // Start countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 0) {
            clearInterval(timer)
            // Refresh the page
            window.location.reload()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    } else {
      // Clear the flag for future errors
      sessionStorage.removeItem("error_refresh_attempted")
    }
  }, [])

  return (
    <Alert className="bg-amber-50 border-amber-200 text-amber-800 flex items-center space-x-2 my-4">
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Recovering</AlertTitle>
      </div>
      <AlertDescription>
        {message} Refreshing in {countdown} seconds...
      </AlertDescription>
    </Alert>
  )
}
