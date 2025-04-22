"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { CustomQuestionsForm } from "@/components/events/custom-questions-form"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Loader2, CheckCircle } from "lucide-react"

export default function FormCustomizationPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const eventId = params.id
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [eventData, setEventData] = useState<any>(null)
  const [formData, setFormData] = useState<{
    attendee: any[]
    volunteer: any[]
    speaker: any[]
  }>({
    attendee: [],
    volunteer: [],
    speaker: [],
  })
  const [formStatus, setFormStatus] = useState<{
    attendee: string
    volunteer: string
    speaker: string
  }>({
    attendee: "draft",
    volunteer: "draft",
    speaker: "draft",
  })

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch event data")
        }
        const data = await response.json()
        setEventData(data)

        // Extract form data from the event
        const customQuestions = data.event.customQuestions || {}
        const formDataObj = {
          attendee: Array.isArray(customQuestions.attendee) ? customQuestions.attendee : [],
          volunteer: Array.isArray(customQuestions.volunteer) ? customQuestions.volunteer : [],
          speaker: Array.isArray(customQuestions.speaker) ? customQuestions.speaker : [],
        }
        setFormData(formDataObj)

        // Extract form status from the event
        const formStatusObj = {
          attendee: data.event.attendeeForm?.status || "draft",
          volunteer: data.event.volunteerForm?.status || "draft",
          speaker: data.event.speakerForm?.status || "draft",
        }
        setFormStatus(formStatusObj)

        setLoading(false)
      } catch (error) {
        console.error("Error fetching event data:", error)
        toast({
          title: "Error",
          description: "Failed to fetch event data. Please try again.",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    fetchEventData()
  }, [eventId])

  const handleFormDataChange = (formType: string, questions: any[]) => {
    setFormData((prev) => ({
      ...prev,
      [formType]: questions,
    }))
  }

  const handleStatusChange = (formType: string, status: string) => {
    setFormStatus((prev) => ({
      ...prev,
      [formType]: status,
    }))
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      // Update the event with all form data at once
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customQuestions: formData,
          attendeeForm: { status: formStatus.attendee },
          volunteerForm: { status: formStatus.volunteer },
          speakerForm: { status: formStatus.speaker },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save form data")
      }

      toast({
        title: "Success",
        description: "All forms have been saved successfully.",
      })

      // Refresh the page data
      router.refresh()
    } catch (error) {
      console.error("Error saving form data:", error)
      toast({
        title: "Error",
        description: "Failed to save form data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getPublicFormUrl = (formType: string) => {
    if (!eventData?.event?.slug) return "#"
    return `/events/${eventData.event.slug}/${formType === "attendee" ? "register" : formType}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Form Customization</h1>
        <Button onClick={handleSaveAll} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save All Forms
        </Button>
      </div>

      <Tabs defaultValue="attendee" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attendee" className="relative">
            Attendee Form
            <Badge variant={formStatus.attendee === "published" ? "success" : "outline"} className="ml-2">
              {formStatus.attendee === "published" ? "Published" : "Draft"}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="volunteer" className="relative">
            Volunteer Form
            <Badge variant={formStatus.volunteer === "published" ? "success" : "outline"} className="ml-2">
              {formStatus.volunteer === "published" ? "Published" : "Draft"}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="speaker" className="relative">
            Speaker Form
            <Badge variant={formStatus.speaker === "published" ? "success" : "outline"} className="ml-2">
              {formStatus.speaker === "published" ? "Published" : "Draft"}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {["attendee", "volunteer", "speaker"].map((formType) => (
          <TabsContent key={formType} value={formType} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold capitalize">{formType} Form</h2>
                <p className="text-sm text-muted-foreground">
                  Customize the questions for your {formType} registration form.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-sm">
                  Status:
                  <Badge
                    variant={formStatus[formType as keyof typeof formStatus] === "published" ? "success" : "outline"}
                    className="ml-2"
                  >
                    {formStatus[formType as keyof typeof formStatus] === "published" ? "Published" : "Draft"}
                  </Badge>
                </div>
                <Button
                  variant={formStatus[formType as keyof typeof formStatus] === "published" ? "outline" : "default"}
                  onClick={() =>
                    handleStatusChange(
                      formType,
                      formStatus[formType as keyof typeof formStatus] === "published" ? "draft" : "published",
                    )
                  }
                >
                  {formStatus[formType as keyof typeof formStatus] === "published" ? "Unpublish" : "Publish"}
                </Button>
              </div>
            </div>

            {formStatus[formType as keyof typeof formStatus] === "published" && (
              <div className="bg-muted p-4 rounded-md flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>This form is published and available to the public.</span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={getPublicFormUrl(formType)} target="_blank" rel="noopener noreferrer">
                    View Public Form
                  </a>
                </Button>
              </div>
            )}

            <CustomQuestionsForm
              formType={formType}
              initialQuestions={formData[formType as keyof typeof formData] || []}
              onQuestionsChange={(questions) => handleFormDataChange(formType, questions)}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
