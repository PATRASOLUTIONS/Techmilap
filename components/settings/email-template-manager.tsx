"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MarkdownEditor } from "@/components/ui/markdown-editor"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { marked } from "marked"
import DOMPurify from "dompurify"

interface EmailTemplateManagerProps {
  userId: string
}

interface Template {
  _id?: string
  templateName: string
  templateType: string
  designTemplate: string
  subject: string
  content: string
  isDefault: boolean
  variables: string[]
  eventId?: string
}

const TEMPLATE_TYPES = [
  { value: "success", label: "Registration Success" },
  { value: "rejection", label: "Registration Rejection" },
  { value: "ticket", label: "Event Ticket" },
  // not for current push
  // { value: "certificate", label: "Event Certificate" },
  // { value: "reminder", label: "Event Reminder" },
  // { value: "custom", label: "Custom Template" },
]

const DESIGN_TEMPLATES = [
  { value: "simple", label: "Simple" },
  { value: "modern", label: "Modern" },
  { value: "elegant", label: "Elegant" },
  { value: "colorful", label: "Colorful" },
  { value: "minimal", label: "Minimal" },
]

export function EmailTemplateManager({ userId }: EmailTemplateManagerProps) {
  const [activeTab, setActiveTab] = useState(TEMPLATE_TYPES[0].value)
  const [templates, setTemplates] = useState<Record<string, Template[]>>({})
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const { toast } = useToast()

  // Load templates on component mount
  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setIsLoading(true)
      setError("")

      // Make sure we're using the correct userId parameter
      const response = await fetch(`/api/email-templates?userId=${userId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch templates")
      }

      const data = await response.json()

      // Organize templates by type
      const organizedTemplates: Record<string, Template[]> = {}

      TEMPLATE_TYPES.forEach((type) => {
        organizedTemplates[type.value] = data.templates.filter(
          (template: Template) => template.templateType === type.value && template.userId === userId,
        )
      })

      setTemplates(organizedTemplates)

      // Set current template to the default one for the active tab
      const defaultTemplate = organizedTemplates[activeTab]?.find((t) => t.isDefault)
      if (defaultTemplate) {
        setCurrentTemplate(defaultTemplate)
      } else if (organizedTemplates[activeTab]?.length > 0) {
        setCurrentTemplate(organizedTemplates[activeTab][0])
      } else {
        // Create a new template if none exists
        setCurrentTemplate(createEmptyTemplate(activeTab))
        setIsEditing(true)
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching templates")
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createEmptyTemplate = (type: string): Template => {
    return {
      templateName: `Default ${TEMPLATE_TYPES.find((t) => t.value === type)?.label || "Template"}`,
      templateType: type,
      designTemplate: "simple",
      subject: "",
      content: getDefaultContent(type),
      isDefault: true,
      variables: getDefaultVariables(type),
    }
  }

  const getDefaultContent = (type: string): string => {
    switch (type) {
      case "success":
        return "Dear {{attendeeName}},\n\nYour registration for **{{eventName}}** has been confirmed!\n\n**Event Details:**\n- Date: {{eventDate}}\n- Time: {{eventTime}}\n- Location: {{eventLocation}}\n\nWe look forward to seeing you there!\n\nBest regards,\n{{organizerName}}"
      case "rejection":
        return "Dear {{attendeeName}},\n\nThank you for your interest in **{{eventName}}**.\n\nWe regret to inform you that we are unable to confirm your registration at this time.\n\nPlease contact us if you have any questions.\n\nBest regards,\n{{organizerName}}"
      case "ticket":
        return "# Event Ticket\n\n**{{eventName}}**\n\nAttendee: {{attendeeName}}<br>\nTicket ID: {{ticketId}}<br>\nDate: {{eventDate}}<br>\nTime: {{eventTime}}<br>\nLocation: {{eventLocation}}\n\n*Please present this ticket at the event entrance.*"
      case "certificate":
        return "# Certificate of Participation\n\nThis is to certify that\n\n**{{attendeeName}}**\n\nhas successfully participated in\n\n**{{eventName}}**\n\nheld on {{eventDate}} at {{eventLocation}}.\n\n{{organizerName}}\nEvent Organizer"
      case "reminder":
        return "Dear {{attendeeName}},\n\nThis is a friendly reminder about the upcoming event:\n\n**{{eventName}}**\n\n**Event Details:**\n- Date: {{eventDate}}\n- Time: {{eventTime}}\n- Location: {{eventLocation}}\n\nWe look forward to seeing you there!\n\nBest regards,\n{{organizerName}}"
      default:
        return "Dear {{recipientName}},\n\nThank you for your interest in our events.\n\n{{customMessage}}\n\nBest regards,\n{{organizerName}}"
    }
  }

  const getDefaultVariables = (type: string): string[] => {
    const commonVars = ["attendeeName", "eventName", "eventDate", "eventTime", "eventLocation", "organizerName"]

    switch (type) {
      case "ticket":
        return [...commonVars, "ticketId", "ticketUrl"]
      case "certificate":
        return [...commonVars, "certificateId"]
      case "custom":
        return ["recipientName", "customMessage", "organizerName"]
      default:
        return commonVars
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setError("")
    setSuccess("")

    // Set current template to the default one for the selected tab
    const defaultTemplate = templates[value]?.find((t) => t.isDefault)
    if (defaultTemplate) {
      setCurrentTemplate(defaultTemplate)
      setIsEditing(false)
    } else if (templates[value]?.length > 0) {
      setCurrentTemplate(templates[value][0])
      setIsEditing(false)
    } else {
      // Create a new template if none exists
      setCurrentTemplate(createEmptyTemplate(value))
      setIsEditing(true)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = templates[activeTab]?.find((t) => t._id === templateId)
    if (template) {
      setCurrentTemplate(template)
      setIsEditing(false)
      setError("")
      setSuccess("")
    }
  }

  const handleCreateNew = () => {
    setCurrentTemplate(createEmptyTemplate(activeTab))
    setIsEditing(true)
    setError("")
    setSuccess("")
  }

  const handleEdit = () => {
    setIsEditing(true)
    setError("")
    setSuccess("")
  }

  const handleCancel = () => {
    if (currentTemplate?._id) {
      // Revert to saved template
      const template = templates[activeTab]?.find((t) => t._id === currentTemplate._id)
      if (template) {
        setCurrentTemplate(template)
      }
    } else {
      // If it was a new template, go back to the default one
      const defaultTemplate = templates[activeTab]?.find((t) => t.isDefault)
      if (defaultTemplate) {
        setCurrentTemplate(defaultTemplate)
      } else if (templates[activeTab]?.length > 0) {
        setCurrentTemplate(templates[activeTab][0])
      }
    }
    setIsEditing(false)
    setError("")
    setSuccess("")
  }

  const handleSave = async () => {
    if (!currentTemplate) return

    try {
      setIsLoading(true)
      setError("")

      const method = currentTemplate._id ? "PUT" : "POST"
      const url = currentTemplate._id ? `/api/email-templates/${currentTemplate._id}` : "/api/email-templates"

      // Ensure userId is included in the template data
      const templateData = {
        ...currentTemplate,
        userId, // Make sure userId is included
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save template")
      }

      const savedTemplate = await response.json()

      // Update templates list
      await fetchTemplates()

      setIsEditing(false)
      setSuccess("Template saved successfully!")
      toast({
        title: "Success",
        description: "Email template saved successfully",
      })

      // If this is a default template, make sure it's used for future emails
      if (currentTemplate.isDefault) {
        console.log(`Template set as default for type: ${currentTemplate.templateType}`)
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while saving the template")
      toast({
        title: "Error",
        description: err.message || "Failed to save template",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!currentTemplate?._id) return

    if (!confirm("Are you sure you want to delete this template?")) {
      return
    }

    try {
      setIsLoading(true)
      setError("")

      const response = await fetch(`/api/email-templates/${currentTemplate._id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete template")
      }

      // Update templates list
      await fetchTemplates()

      toast({
        title: "Success",
        description: "Email template deleted successfully",
      })
    } catch (err: any) {
      setError(err.message || "An error occurred while deleting the template")
      toast({
        title: "Error",
        description: err.message || "Failed to delete template",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof Template, value: string) => {
    if (!currentTemplate) return

    setCurrentTemplate({
      ...currentTemplate,
      [field]: value,
    })
  }

  const handleSetDefault = async () => {
    if (!currentTemplate?._id) return

    try {
      setIsLoading(true)
      setError("")

      const response = await fetch(`/api/email-templates/${currentTemplate._id}/set-default`, {
        method: "PUT",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to set as default")
      }

      // Update templates list
      await fetchTemplates()

      setSuccess("Template set as default successfully!")
      toast({
        title: "Success",
        description: "Template set as default",
      })
    } catch (err: any) {
      setError(err.message || "An error occurred while setting default template")
      toast({
        title: "Error",
        description: err.message || "Failed to set as default",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderPreview = () => {
    if (!currentTemplate) return null

    // Replace variables with sample values
    let previewContent = currentTemplate.content
    currentTemplate.variables.forEach((variable) => {
      const sampleValue = getSampleValue(variable)
      previewContent = previewContent.replace(new RegExp(`{{${variable}}}`, "g"), sampleValue)
    })

    // Configure marked to treat single newlines as <br> tags
    const markedOptions = {
      async: false,
      breaks: true, // This is the key change
    }
    const parsedHtml = marked.parse(previewContent, markedOptions)
    // console.log("Markdown Input:", previewContent) // You can keep or remove these logs
    // console.log("Parsed HTML Output:", parsedHtml)

    return (
      <div className="border rounded-md p-4 bg-white">
        <div className="mb-4 pb-4 border-b">
          <div className="font-semibold text-sm text-muted-foreground">Subject:</div>
          <div>{currentTemplate.subject}</div>
        </div>
        <div className="prose prose-sm max-w-none">
          {/* Parse Markdown to HTML and sanitize before rendering */}
          <div
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(parsedHtml) }}
          />
        </div>
      </div>
    )
  }

  const getSampleValue = (variable: string): string => {
    const sampleValues: Record<string, string> = {
      attendeeName: "John Doe",
      eventName: "Tech Conference 2023",
      eventDate: "October 15, 2023",
      eventTime: "10:00 AM - 4:00 PM",
      eventLocation: "Convention Center, New York",
      organizerName: "Tech Events Inc.",
      ticketId: "TICKET-12345",
      ticketUrl: "https://example.com/tickets/TICKET-12345",
      certificateId: "CERT-67890",
      recipientName: "Jane Smith",
      customMessage: "We have an exciting announcement to share with you soon!",
    }

    return sampleValues[variable] || `{{${variable}}}`
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/*
          Removed grid layout for mobile, using flex with horizontal scroll.
          Kept grid layout for medium screens and up.
        */}
  <TabsList
    className="
      flex w-full gap-2 overflow-x-auto whitespace-nowrap
      xl:grid xl:grid-cols-6 xl:overflow-visible xl:whitespace-normal
      scrollbar-hide mb-4
    "
  >         {TEMPLATE_TYPES.map((type) => (
            <TabsTrigger key={type.value} value={type.value}>
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TEMPLATE_TYPES.map((type) => (
          <TabsContent key={type.value} value={type.value} className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                {templates[type.value]?.length > 0 && (
                  <Select
                    value={currentTemplate?._id || ""}
                    onValueChange={handleTemplateSelect}
                    disabled={isEditing || isLoading}
                  >
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates[type.value]?.map((template) => (
                        <SelectItem key={template._id} value={template._id || ""}>
                          {template.templateName} {template.isDefault && "(Default)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Button variant="outline" onClick={handleCreateNew} disabled={isEditing || isLoading}>
                  Create New
                </Button>
              </div>

              <div className="space-x-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                      {isLoading ? "Saving..." : "Save Template"}
                    </Button>
                  </>
                ) : (
                  <>
                    {currentTemplate?._id && (
                      <>
                        <Button variant="outline" onClick={handleEdit} disabled={isLoading}>
                          Edit
                        </Button>
                        {!currentTemplate.isDefault && (
                          <Button variant="outline" onClick={handleSetDefault} disabled={isLoading}>
                            Set as Default
                          </Button>
                        )}
                        <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                          Delete
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 border-green-200 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Template Editor */}
              <Card>
                <CardHeader>
                  <CardTitle>Template Editor</CardTitle>
                  <CardDescription>
                    Customize your email template for {TEMPLATE_TYPES.find((t) => t.value === type.value)?.label}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="templateName">Template Name</Label>
                        <Input
                          id="templateName"
                          value={currentTemplate?.templateName || ""}
                          onChange={(e) => handleInputChange("templateName", e.target.value)}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="designTemplate">Design Template</Label>
                        <Select
                          value={currentTemplate?.designTemplate || "simple"}
                          onValueChange={(value) => handleInputChange("designTemplate", value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger id="designTemplate">
                            <SelectValue placeholder="Select a design" />
                          </SelectTrigger>
                          <SelectContent>
                            {DESIGN_TEMPLATES.map((design) => (
                              <SelectItem key={design.value} value={design.value}>
                                {design.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">Email Subject</Label>
                        <Input
                          id="subject"
                          value={currentTemplate?.subject || ""}
                          onChange={(e) => handleInputChange("subject", e.target.value)}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="content">Email Content</Label>
                        <MarkdownEditor
                          value={currentTemplate?.content || ""}
                          onChange={(value) => handleInputChange("content", value)}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Available Variables</Label>
                        <div className="flex flex-wrap gap-2">
                          {currentTemplate?.variables.map((variable) => (
                            <div
                              key={variable}
                              className="bg-muted px-2 py-1 rounded-md text-xs"
                              title={`Use as {{${variable}}}`}
                            >
                              {`{{${variable}}}`}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {currentTemplate ? (
                        <div className="space-y-2">
                          <div>
                            <strong>Template Name:</strong> {currentTemplate.templateName}
                          </div>
                          <div>
                            <strong>Design:</strong>{" "}
                            {DESIGN_TEMPLATES.find((d) => d.value === currentTemplate.designTemplate)?.label}
                          </div>
                          <div>
                            <strong>Subject:</strong> {currentTemplate.subject}
                          </div>
                          <div className="mt-4">
                            <Button variant="outline" onClick={handleEdit}>
                              Edit Template
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p>No template selected</p>
                          <Button onClick={handleCreateNew}>Create New Template</Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>This is how your email will look with sample data</CardDescription>
                </CardHeader>
                <CardContent>
                  {currentTemplate ? (
                    renderPreview()
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No template to preview</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-muted/50 border-t">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Info className="h-3 w-3 mr-1" />
                    Variables like {`{{eventName}}`} will be replaced with actual data when sending emails
                  </div>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
