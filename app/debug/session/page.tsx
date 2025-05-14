"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

export default function SessionDebugPage() {
  const { data: session, status, update } = useSession()
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/auth/me")
        const data = await response.json()
        setApiResponse(data)
        setError(null)
      } catch (err) {
        console.error("Error fetching user data:", err)
        setError("Failed to fetch user data from API")
      } finally {
        setLoading(false)
      }
    }

    if (status === "authenticated") {
      fetchUserData()
    }
  }, [status])

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-[#170f83]">Session Debug</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Session Status</CardTitle>
            <CardDescription>Current authentication status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-md overflow-x-auto">
              <pre className="text-sm">{status}</pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Data</CardTitle>
            <CardDescription>Current session information from useSession()</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-md overflow-x-auto">
              <pre className="text-sm">{JSON.stringify(session, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API User Data</CardTitle>
            <CardDescription>User data from /api/auth/me endpoint</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <div className="p-4 bg-gray-50 rounded-md overflow-x-auto">
                <pre className="text-sm">{JSON.stringify(apiResponse, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={() => update()} className="bg-[#170f83]">
            Refresh Session
          </Button>
          <Button onClick={() => window.location.reload()} className="bg-[#0aacf7]">
            Reload Page
          </Button>
          <Button onClick={() => (window.location.href = "/my-events")} className="bg-[#fea91b]">
            Go to My Events
          </Button>
        </div>

        {status === "authenticated" && (
          <Alert className="bg-[#170f83]/10 border-[#170f83]/20">
            <Info className="h-4 w-4" />
            <AlertDescription>
              You are currently authenticated as {session?.user?.name || "Unknown User"} with role{" "}
              {session?.user?.role || "Unknown Role"}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
