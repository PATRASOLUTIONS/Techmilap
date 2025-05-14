"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"

export function DashboardNavigation() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const navigateTo = (path: string) => {
    router.push(path)
  }

  if (!isOpen) {
    return (
      <Button className="fixed bottom-4 right-4 z-50 bg-[#170f83]" onClick={() => setIsOpen(true)}>
        Dashboard Navigation
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-[#fea91b]" />
            Dashboard Navigation
          </CardTitle>
          <CardDescription>Use these links to navigate directly to dashboard pages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => navigateTo("/dashboard")} className="w-full bg-[#170f83]">
              Dashboard
            </Button>
            <Button onClick={() => navigateTo("/my-events")} className="w-full bg-[#0aacf7]">
              My Events
            </Button>
            <Button onClick={() => navigateTo("/debug/session")} className="w-full bg-gray-500">
              Debug Session
            </Button>
            <Button onClick={() => window.location.reload()} className="w-full bg-gray-700">
              Reload Page
            </Button>
          </div>

          <Button onClick={() => setIsOpen(false)} variant="outline" className="w-full mt-4">
            Close
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
