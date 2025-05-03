"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"

export default function DebugEmailDesignPage() {
  const [userId, setUserId] = useState("")
  const [preference, setPreference] = useState("modern")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const checkDesignPreference = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Please enter a user ID",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/debug/email-design?userId=${userId}`)
      const data = await response.json()

      if (response.ok) {
        setResult(data)
        toast({
          title: "Success",
          description: `User's email design preference is "${data.emailDesignPreference}"`,
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to check design preference",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error checking design preference:", error)
      toast({
        title: "Error",
        description: "An error occurred while checking the design preference",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateDesignPreference = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Please enter a user ID",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/debug/email-design", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, preference }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        toast({
          title: "Success",
          description: data.message || "Email design preference updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update design preference",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating design preference:", error)
      toast({
        title: "Error",
        description: "An error occurred while updating the design preference",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Debug Email Design Preferences</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Check Email Design Preference</CardTitle>
            <CardDescription>Enter a user ID to check their current email design preference</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="userId" className="block text-sm font-medium mb-1">
                  User ID
                </label>
                <Input
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter user ID"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={checkDesignPreference} disabled={loading}>
              {loading ? "Checking..." : "Check Preference"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Email Design Preference</CardTitle>
            <CardDescription>Update a user's email design preference directly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="updateUserId" className="block text-sm font-medium mb-1">
                  User ID
                </label>
                <Input
                  id="updateUserId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter user ID"
                />
              </div>
              <div>
                <label htmlFor="preference" className="block text-sm font-medium mb-1">
                  Design Preference
                </label>
                <Select value={preference} onValueChange={setPreference}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select design" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="elegant">Elegant</SelectItem>
                    <SelectItem value="colorful">Colorful</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={updateDesignPreference} disabled={loading}>
              {loading ? "Updating..." : "Update Preference"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {result && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
