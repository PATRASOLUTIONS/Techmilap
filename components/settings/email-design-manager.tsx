"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2 } from "lucide-react"
import { EmailDesignPreview } from "./email-design-preview"

interface EmailDesign {
  id: string
  name: string
  description: string
  thumbnail: string
}

export const EmailDesignManager = ({ userId }: { userId: string }) => {
  const [selectedDesign, setSelectedDesign] = useState<string>("modern")
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Email design options
  const emailDesigns: EmailDesign[] = [
    {
      id: "modern",
      name: "Modern",
      description: "A clean, contemporary design with blue accents",
      thumbnail: "/placeholder.svg?key=mp51s",
    },
    {
      id: "elegant",
      name: "Elegant",
      description: "A sophisticated design with serif fonts",
      thumbnail: "/placeholder.svg?key=30o4m",
    },
    {
      id: "colorful",
      name: "Colorful",
      description: "A vibrant design with gradients and bold colors",
      thumbnail: "/placeholder.svg?key=z7f19",
    },
    {
      id: "minimal",
      name: "Minimal",
      description: "A clean design with minimal styling",
      thumbnail: "/placeholder.svg?key=uyxol",
    },
    {
      id: "corporate",
      name: "Corporate",
      description: "A professional design for business communications",
      thumbnail: "/placeholder.svg?key=i322z",
    },
  ]

  useEffect(() => {
    // Fetch the user's current design preference
    const fetchDesignPreference = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/email-design-preference`)
        if (response.ok) {
          const data = await response.json()
          if (data.designPreference) {
            setSelectedDesign(data.designPreference)
          }
        }
      } catch (error) {
        console.error("Error fetching design preference:", error)
      } finally {
        setInitialLoading(false)
      }
    }

    fetchDesignPreference()
  }, [userId])

  const saveDesignPreference = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}/email-design-preference`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ designPreference: selectedDesign }),
      })

      if (response.ok) {
        toast({
          title: "Design preference saved",
          description: "Your email design preference has been updated successfully.",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save design preference")
      }
    } catch (error: any) {
      console.error("Error saving design preference:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save your design preference. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading your design preferences...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="bg-muted/50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Select Your Email Design</h2>
        <p className="text-muted-foreground mb-6">
          Choose a design template that will be used for all your email communications. This design will be applied to
          registration confirmations, tickets, certificates, and other emails.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {emailDesigns.map((design) => (
            <Card
              key={design.id}
              className={`cursor-pointer transition-all overflow-hidden ${
                selectedDesign === design.id
                  ? "ring-2 ring-primary shadow-md"
                  : "hover:shadow-md border-muted-foreground/20"
              }`}
              onClick={() => setSelectedDesign(design.id)}
            >
              <div className="relative h-40 bg-muted">
                <img
                  src={design.thumbnail || "/placeholder.svg"}
                  alt={`${design.name} template preview`}
                  className="w-full h-full object-cover"
                />
                {selectedDesign === design.id && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary">
                      <Check className="h-3 w-3 mr-1" /> Selected
                    </Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg">{design.name}</h3>
                <p className="text-muted-foreground text-sm">{design.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={saveDesignPreference} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Saving..." : "Save Preference"}
          </Button>
        </div>
      </div>

      <div className="bg-muted/50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Preview Your Selected Design</h2>
        <p className="text-muted-foreground mb-6">
          See how your emails will look with the selected design. Toggle between different email types to preview each
          one.
        </p>

        <EmailDesignPreview designId={selectedDesign} />
      </div>
    </div>
  )
}

export default EmailDesignManager
