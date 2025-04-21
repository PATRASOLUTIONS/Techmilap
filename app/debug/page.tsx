"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function DebugPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Debug</CardTitle>
          <CardDescription>View your current authentication status and session data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">Status:</h3>
            <p className="font-mono bg-muted p-2 rounded">{status}</p>
          </div>

          {session ? (
            <div>
              <h3 className="font-medium">Session Data:</h3>
              <pre className="font-mono bg-muted p-2 rounded overflow-auto max-h-96">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          ) : (
            <p>No active session</p>
          )}

          <div className="flex gap-4 pt-4">
            <Button onClick={() => router.push("/login")}>Go to Login</Button>
            <Button onClick={() => router.push("/api/seed")} variant="outline">
              Seed Demo Users
            </Button>
            <Button onClick={() => router.push("/")} variant="secondary">
              Go to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
