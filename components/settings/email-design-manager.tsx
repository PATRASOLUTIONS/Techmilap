"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { EmailDesignPreview } from "./email-design-preview"
import { Check, Info } from "lucide-react"

interface EmailDesign {
  id: string
  name: string
  description: string
  thumbnail: string
}

export function EmailDesignManager({ userId }: { userId: string }) {
  const [selectedDesign, setSelectedDesign] = useState<string>("modern")
  const [loading, setLoading] = useState(false)
  const [currentDesign, setCurrentDesign] = useState<string>("modern")

  // Enhanced email designs with better descriptions and proper thumbnails
  const emailDesigns: EmailDesign[] = [
    {
      id: "modern",
      name: "Modern",
      description: "A clean, contemporary design with vibrant blue accents and clear typography",
      thumbnail: "/placeholder.svg?key=0s2kl",
    },
    {
      id: "elegant",
      name: "Elegant",
      description: "A sophisticated design with serif fonts and refined spacing for a premium feel",
      thumbnail: "/placeholder.svg?key=0dc6m",
    },
    {
      id: "colorful",
      name: "Colorful",
      description: "A vibrant design with gradient accents and modern styling for engaging communications",
      thumbnail: "/placeholder.svg?key=txe0r",
    },
    {
      id: "minimal",
      name: "Minimal",
      description: "A clean, distraction-free design focusing on content with subtle styling",
      thumbnail: "/placeholder.svg?key=lhg3m",
    },
    {
      id: "corporate",
      name: "Corporate",
      description: "A professional design suitable for business communications with structured layout",
      thumbnail: "/placeholder.svg?key=d7tnn",
    },
  ]

  useEffect(() => {
    // Fetch the user's current design preference
    const fetchDesignPreference = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/email-design-preference`)
        if (response.ok) {
          const data = await response.json()
          if (data.preference) {
            setSelectedDesign(data.preference)
            setCurrentDesign(data.preference)
          }
        }
      } catch (error) {
        console.error("Error fetching design preference:", error)
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
        setCurrentDesign(selectedDesign)
        toast({
          title: "Design preference saved",
          description: "Your email design preference has been updated successfully.",
        })
      } else {
        throw new Error("Failed to save design preference")
      }
    } catch (error) {
      console.error("Error saving design preference:", error)
      toast({
        title: "Error",
        description: "Failed to save your design preference. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const hasChanges = selectedDesign !== currentDesign

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {emailDesigns.map((design) => (
          <Card
            key={design.id}
            className={`overflow-hidden transition-all ${
              selectedDesign === design.id ? "ring-2 ring-primary" : "hover:shadow-md"
            }`}
          >
            <div
              className="h-32 bg-cover bg-center cursor-pointer"
              style={{ backgroundImage: `url(${design.thumbnail})` }}
              onClick={() => setSelectedDesign(design.id)}
            />
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{design.name}</h3>
                  <p className="text-sm text-muted-foreground">{design.description}</p>
                </div>
                {selectedDesign === design.id && (
                  <div className="bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between">
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedDesign(design.id)}>
                {selectedDesign === design.id ? "Selected" : "Select"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => window.open(`#preview-${design.id}`, "_self")}
              >
                Preview
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {hasChanges && (
        <div className="bg-muted p-4 rounded-lg flex items-center gap-3">
          <Info className="h-5 w-5 text-blue-500" />
          <p className="text-sm flex-1">
            You've selected a new email design. Click "Save Changes" to apply it to all your email communications.
          </p>
          <Button onClick={saveDesignPreference} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}

      <div className="bg-card border rounded-lg p-6" id={`preview-${selectedDesign}`}>
        <h2 className="text-xl font-semibold mb-6">Email Preview</h2>
        <EmailDesignPreview designId={selectedDesign} />
      </div>
    </div>
  )
}
