"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save, Eye } from "lucide-react"
import Link from "next/link"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CustomQuestionsForm } from "@/components/events/custom-questions-form"

export default function CustomizeAttendeesFormPage() {
  const { id } = useParams() || {}
  const eventId = Array.isArray(id) ? id[0] : id
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [formConfig, setFormConfig] = useState(null)
  const [isPublished, setIsPublished] = useState(false)
  const [activeTab, setActiveTab] = useState("questions")
  const [eventTitle, setEventTitle] = useState("")

  // Add ref to track if form status has been fetched
  const formStatusFetched = useRef(false)

  useEffect(() => {
    // Only fetch form status once
    if (formStatusFetched.current) return

    const fetchFormConfig = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/events/${eventId}/forms/attendee`, {
          headers: {
            "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch form configuration")
        }

        const data = await response.json()
        setFormConfig(data.config || { questions: [] })
        setIsPublished(data.status === "published")
        setEventTitle(data.eventTitle || "")
        formStatusFetched.current = true
      } catch (error) {
        console.error("Error fetching form config:", error)
        toast({
          title: "Error",
          description: "Failed to load form configuration. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchFormConfig()
  }, [eventId, toast])

  const handleSave = async () => {
    if (!formConfig) return

    try {
      setSaving(true)
      const response = await fetch(`/api/events/${eventId}/forms/attendee`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          config: formConfig,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save form configuration")
      }

      toast({
        title: "Form Saved",
        description: "Your form configuration has been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving form config:", error)
      toast({
        title: "Error",
        description: "Failed to save form configuration. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    try {
      setPublishing(true)
      const response = await fetch(`/api/events/${eventId}/forms/attendee/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publish: !isPublished,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update form status")
      }

      setIsPublished(!isPublished)
      toast({
        title: isPublished ? "Form Unpublished" : "Form Published",
        description: isPublished
          ? "Your form is now in draft mode and not accessible to the public."
          : "Your form is now published and accessible to the public.",
      })
    } catch (error) {
      console.error("Error publishing form:", error)
      toast({
        title: "Error",
        description: "Failed to update form status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setPublishing(false)
    }
  }

  const handleFormUpdate = (updatedConfig) => {
    setFormConfig(updatedConfig)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/event-dashboard/${eventId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="h-8 w-64 bg-muted animate-pulse rounded-md"></div>
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/event-dashboard/${eventId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Customize Attendee Form</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
          <div className="flex items-center space-x-2">
            <Switch id="publish" checked={isPublished} onCheckedChange={handlePublish} disabled={publishing} />
            <Label htmlFor="publish" className="cursor-pointer">
              {isPublished ? "Published" : "Draft"}
            </Label>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Attendee Registration Form for {eventTitle}</CardTitle>
          <CardDescription>
            Customize the registration form that attendees will fill out to register for your event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
            <Eye className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isPublished
                ? "Your form is published and accessible to the public."
                : "Your form is in draft mode and not accessible to the public."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="questions">Custom Questions</TabsTrigger>
          <TabsTrigger value="settings">Form Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>Custom Questions</CardTitle>
              <CardDescription>Add custom questions to collect additional information from attendees.</CardDescription>
            </CardHeader>
            <CardContent>
              <CustomQuestionsForm config={formConfig} onUpdate={handleFormUpdate} formType="attendee" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Form Settings</CardTitle>
              <CardDescription>Configure general settings for your registration form.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Form settings will be available in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
