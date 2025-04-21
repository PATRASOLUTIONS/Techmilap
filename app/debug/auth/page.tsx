"use client"

import { useState } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Info } from "lucide-react"

export default function AuthDebugPage() {
  const { data: session, status } = useSession()
  const [email, setEmail] = useState("user@gmail.com")
  const [password, setPassword] = useState("password123")
  const [error, setError] = useState("")
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleTestLogin = async () => {
    setIsLoading(true)
    setError("")
    setResult(null)

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      setResult(result)

      if (result?.error) {
        setError(result.error)
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Debug</CardTitle>
          <CardDescription>Test authentication and view session data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">Current Status:</h3>
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
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>No active session</AlertDescription>
            </Alert>
          )}

          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium mb-4">Test Login</h3>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && !error && (
              <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
                <Info className="h-4 w-4" />
                <AlertDescription>Login successful!</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              <Button onClick={handleTestLogin} disabled={isLoading}>
                {isLoading ? "Testing..." : "Test Login"}
              </Button>
            </div>

            {result && (
              <div className="mt-4">
                <h3 className="font-medium">Login Result:</h3>
                <pre className="font-mono bg-muted p-2 rounded overflow-auto max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={() => signOut({ redirect: false })} variant="outline">
            Sign Out
          </Button>
          <Button onClick={() => (window.location.href = "/api/seed")}>Seed Demo Users</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
