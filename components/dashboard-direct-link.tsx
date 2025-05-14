"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

export function DashboardDirectLink() {
  const [isVisible, setIsVisible] = useState(true)

  // Hide after 30 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 30000)
    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <Card>
        <CardContent className="p-4">
          <Button onClick={() => (window.location.href = "/dashboard")} className="bg-[#170f83]">
            Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
