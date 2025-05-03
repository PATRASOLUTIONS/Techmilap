"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"

interface EmailDesign {
  id: string
  name: string
  description: string
  previewHtml: string
}

// Export as a named export instead of default export
export const EmailDesignManager: React.FC = () => {
  const [selectedDesign, setSelectedDesign] = useState<string>("modern")
  const [loading, setLoading] = useState(false)

  // Sample email designs
  const emailDesigns: EmailDesign[] = [
    {
      id: "modern",
      name: "Modern",
      description: "A clean, contemporary design with blue accents",
      previewHtml: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #4f46e5; padding: 20px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Tech Milap</h1>
          </div>
          <p style="color: #6b7280; font-size: 16px;">Hello John,</p>
          <div style="color: #374151; font-size: 16px; line-height: 1.6;">
            <p>Thank you for registering for our event. Your registration has been confirmed.</p>
            <p>Event details:</p>
            <ul>
              <li>Event: Annual Tech Conference</li>
              <li>Date: October 15, 2023</li>
              <li>Location: Convention Center</li>
            </ul>
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 14px;">
            <p>© 2023 Tech Milap. All rights reserved.</p>
          </div>
        </div>
      `,
    },
    {
      id: "elegant",
      name: "Elegant",
      description: "A sophisticated design with serif fonts",
      previewHtml: `
        <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #fcfcfc; border: 1px solid #e5e7eb;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; font-size: 28px; font-weight: normal;">Tech Milap</h1>
          </div>
          <p style="color: #4b5563; font-size: 17px;">Dear John,</p>
          <div style="color: #1f2937; font-size: 17px; line-height: 1.7;">
            <p>Thank you for registering for our event. Your registration has been confirmed.</p>
            <p>Event details:</p>
            <ul>
              <li>Event: Annual Tech Conference</li>
              <li>Date: October 15, 2023</li>
              <li>Location: Convention Center</li>
            </ul>
          </div>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 15px; text-align: center;">
            <p>© 2023 Tech Milap</p>
          </div>
        </div>
      `,
    },
    {
      id: "colorful",
      name: "Colorful",
      description: "A vibrant design with gradients and bold colors",
      previewHtml: `
        <div style="font-family: 'Verdana', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f0f9ff; border-radius: 12px; border: 2px solid #bfdbfe;">
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 26px;">Tech Milap</h1>
          </div>
          <p style="color: #4b5563; font-size: 16px; font-weight: bold;">Hi John!</p>
          <div style="color: #1f2937; font-size: 16px; line-height: 1.6; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);">
            <p>Thank you for registering for our event. Your registration has been confirmed.</p>
            <p>Event details:</p>
            <ul>
              <li>Event: Annual Tech Conference</li>
              <li>Date: October 15, 2023</li>
              <li>Location: Convention Center</li>
            </ul>
          </div>
          <div style="margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
            <p>© 2023 Tech Milap | <a href="#" style="color: #4f46e5; text-decoration: none;">Unsubscribe</a></p>
          </div>
        </div>
      `,
    },
    {
      id: "minimal",
      name: "Minimal",
      description: "A clean design with minimal styling",
      previewHtml: `
        <div style="font-family: 'Helvetica', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
          <div style="margin-bottom: 30px;">
            <h1 style="color: #111827; font-size: 22px; font-weight: 500;">Tech Milap</h1>
          </div>
          <p style="color: #374151; font-size: 16px;">Hello John,</p>
          <div style="color: #1f2937; font-size: 16px; line-height: 1.6;">
            <p>Thank you for registering for our event. Your registration has been confirmed.</p>
            <p>Event details:</p>
            <ul>
              <li>Event: Annual Tech Conference</li>
              <li>Date: October 15, 2023</li>
              <li>Location: Convention Center</li>
            </ul>
          </div>
          <div style="margin-top: 40px; color: #9ca3af; font-size: 14px;">
            <p>© 2023 Tech Milap</p>
          </div>
        </div>
      `,
    },
    {
      id: "simple",
      name: "Simple",
      description: "A basic design for straightforward communication",
      previewHtml: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p>Hello John,</p>
          <div>
            <p>Thank you for registering for our event. Your registration has been confirmed.</p>
            <p>Event details:</p>
            <ul>
              <li>Event: Annual Tech Conference</li>
              <li>Date: October 15, 2023</li>
              <li>Location: Convention Center</li>
            </ul>
          </div>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eaeaea; color: #666; font-size: 12px;">
            <p>© 2023 Tech Milap. All rights reserved.</p>
          </div>
        </div>
      `,
    },
  ]

  useEffect(() => {
    // Fetch the user's current design preference
    const fetchDesignPreference = async () => {
      try {
        const response = await fetch("/api/users/me/email-design-preference")
        if (response.ok) {
          const data = await response.json()
          if (data.preference) {
            setSelectedDesign(data.preference)
          }
        }
      } catch (error) {
        console.error("Error fetching design preference:", error)
      }
    }

    fetchDesignPreference()
  }, [])

  const saveDesignPreference = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/users/me/email-design-preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ preference: selectedDesign }),
      })

      if (response.ok) {
        toast({
          title: "Design preference saved",
          description: "Your email design preference has been updated.",
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

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Email Design Templates</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {emailDesigns.map((design) => (
          <Card
            key={design.id}
            className={`cursor-pointer transition-all ${selectedDesign === design.id ? "ring-2 ring-primary" : "hover:shadow-md"}`}
            onClick={() => setSelectedDesign(design.id)}
          >
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">{design.name}</h3>
                <p className="text-muted-foreground">{design.description}</p>
              </div>

              <div className="border rounded-md p-2 bg-gray-50 h-48 overflow-auto">
                <div dangerouslySetInnerHTML={{ __html: design.previewHtml }} />
              </div>

              <div className="mt-4 flex justify-between items-center">
                <span
                  className={`text-sm ${selectedDesign === design.id ? "text-primary font-medium" : "text-muted-foreground"}`}
                >
                  {selectedDesign === design.id ? "Selected" : "Click to select"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end mb-8">
        <Button onClick={saveDesignPreference} disabled={loading}>
          {loading ? "Saving..." : "Save Preference"}
        </Button>
      </div>

      <div className="bg-muted p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Preview Email Templates</h2>

        <Tabs defaultValue="success">
          <TabsList className="mb-4">
            <TabsTrigger value="success">Success Email</TabsTrigger>
            <TabsTrigger value="rejection">Rejection Email</TabsTrigger>
            <TabsTrigger value="ticket">Ticket Email</TabsTrigger>
          </TabsList>

          <TabsContent value="success" className="border rounded-md p-4 bg-white">
            <div
              dangerouslySetInnerHTML={{
                __html: emailDesigns.find((d) => d.id === selectedDesign)?.previewHtml || "",
              }}
            />
          </TabsContent>

          <TabsContent value="rejection" className="border rounded-md p-4 bg-white">
            <div
              dangerouslySetInnerHTML={{
                __html:
                  emailDesigns
                    .find((d) => d.id === selectedDesign)
                    ?.previewHtml.replace(
                      "Your registration has been confirmed.",
                      "We regret to inform you that your registration could not be accepted at this time.",
                    ) || "",
              }}
            />
          </TabsContent>

          <TabsContent value="ticket" className="border rounded-md p-4 bg-white">
            <div
              dangerouslySetInnerHTML={{
                __html:
                  emailDesigns
                    .find((d) => d.id === selectedDesign)
                    ?.previewHtml.replace(
                      "Your registration has been confirmed.",
                      "Your ticket for the event is attached. Please present this ticket at the entrance.",
                    ) || "",
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default EmailDesignManager
