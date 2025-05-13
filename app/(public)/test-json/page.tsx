"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCcw, Bug, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function TestJsonPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rawResponse, setRawResponse] = useState("")
  const [showRaw, setShowRaw] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log("Fetching from test JSON endpoint")
        const response = await fetch("/api/test-json", {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        })

        console.log(`Response status: ${response.status}`)
        console.log(`Response headers:`, Object.fromEntries(response.headers.entries()))

        // Get the raw text response
        const text = await response.text()
        setRawResponse(text)

        try {
          // Try to parse as JSON
          const jsonData = JSON.parse(text)
          setData(jsonData)
        } catch (parseError) {
          console.error("JSON parse error:", parseError)
          setError(`Failed to parse response as JSON: ${parseError.message}`)
        }
      } catch (fetchError) {
        console.error("Fetch error:", fetchError)
        setError(`Failed to fetch data: ${fetchError.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [retryCount])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  const toggleRaw = () => {
    setShowRaw(!showRaw)
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">JSON Test Page</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Testing JSON Response</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="font-medium text-red-700 mb-2">Error</p>
                <p className="text-gray-700">{error}</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleRetry}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={toggleRaw}>
                  <Bug className="mr-2 h-4 w-4" />
                  {showRaw ? "Hide Raw Response" : "Show Raw Response"}
                </Button>
              </div>
              {showRaw && (
                <div className="mt-4 p-3 bg-gray-100 rounded-md overflow-auto max-h-96">
                  <h3 className="font-medium mb-2">Raw Response</h3>
                  <pre className="text-xs whitespace-pre-wrap break-words">{rawResponse}</pre>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="font-medium text-green-700 mb-2">Success</p>
                <p className="text-gray-700">JSON response received successfully!</p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                <h3 className="font-medium mb-2">Response Data</h3>
                <pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify(data, null, 2)}</pre>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleRetry}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button variant="outline" onClick={toggleRaw}>
                  <Bug className="mr-2 h-4 w-4" />
                  {showRaw ? "Hide Raw Response" : "Show Raw Response"}
                </Button>
              </div>
              {showRaw && (
                <div className="mt-4 p-3 bg-gray-100 rounded-md overflow-auto max-h-96">
                  <h3 className="font-medium mb-2">Raw Response</h3>
                  <pre className="text-xs whitespace-pre-wrap break-words">{rawResponse}</pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <p className="text-sm text-gray-500">
          This page tests if the server can properly return JSON responses. If you see a success message, it means the
          server is correctly configured to return JSON. If you see an error, there might be an issue with the server
          configuration.
        </p>
      </div>
    </div>
  )
}
