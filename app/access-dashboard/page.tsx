"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { AlertTriangle, ArrowRight } from "lucide-react"

export default function AccessDashboard() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPath, setSelectedPath] = useState("/dashboard")

  const navigateTo = (path: string) => {
    setIsLoading(true)
    router.push(path)
  }

  // Force navigation after 2 seconds if router.push doesn't work
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        window.location.href = selectedPath
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isLoading, selectedPath])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-[#fea91b]" />
            Dashboard Access
          </CardTitle>
          <CardDescription>Select a page to access directly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Page:</label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedPath}
              onChange={(e) => setSelectedPath(e.target.value)}
            >
              <option value="/dashboard">Dashboard</option>
              <option value="/my-events">My Events</option>
              <option value="/debug/session">Debug Session</option>
            </select>
          </div>

          <Button onClick={() => navigateTo(selectedPath)} className="w-full bg-[#170f83]" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Navigating...
              </span>
            ) : (
              <span className="flex items-center">
                Access Page <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            )}
          </Button>

          <div className="text-sm text-gray-500 mt-4">
            <p>If the navigation doesn't work automatically, you'll be redirected in 2 seconds.</p>
            <p className="mt-2">
              Alternatively, you can manually go to:{" "}
              <code className="bg-gray-100 px-1 py-0.5 rounded">{selectedPath}</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
