"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, Upload, MapPin, Globe, Users, Clock, Link, ImageIcon, Edit } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { MarkdownEditor } from "@/components/ui/markdown-editor"

export function EventDetailsForm({ data, updateData, activeTab, setActiveTab, formData, toast }) {
  const [startDate, setStartDate] = useState(data.startDate ? new Date(data.startDate) : null)
  const [endDate, setEndDate] = useState(data.endDate ? new Date(data.endDate) : null)
  const [imageUploadMethod, setImageUploadMethod] = useState("url")
  const [isEditingSlug, setIsEditingSlug] = useState(false)

  // Generate slug when name changes
  useEffect(() => {
    if (data.name && !data.slug) {
      const generatedSlug = generateSlug(data.name)
      updateData({
        ...data,
        slug: generatedSlug,
      })
    }
  }, [data.name, data.slug, updateData])

  useEffect(() => {
    if (data.startDate) {
      setStartDate(new Date(data.startDate))
    }
    if (data.endDate) {
      setEndDate(new Date(data.endDate))
    }
  }, [data.startDate, data.endDate])

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .trim()
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    updateData({
      ...data,
      [name]: value,
    })

    // Auto-generate slug when name changes
    if (name === "name" && !isEditingSlug) {
      updateData({
        ...data,
        name: value,
        slug: generateSlug(value),
      })
    }
  }

  const handleSlugChange = (e) => {
    const { value } = e.target
    updateData({
      ...data,
      slug: generateSlug(value),
    })
  }

  const handleDateChange = (date, field) => {
    if (field === "startDate") {
      setStartDate(date)
      updateData({
        ...data,
        startDate: date ? date.toISOString() : "",
      })
    } else {
      setEndDate(date)
      updateData({
        ...data,
        endDate: date ? date.toISOString() : "",
      })
    }
  }

  const handleTypeChange = (value) => {
    updateData({
      ...data,
      type: value,
    })
  }

  const handleVisibilityChange = (value) => {
    updateData({
      ...data,
      visibility: value,
    })
  }

  const handleTimeChange = (value, field) => {
    updateData({
      ...data,
      [field]: value,
    })
  }

  const handleImageUpload = (e, field) => {
    const file = e.target.files[0]
    if (file) {
      // In a real app, you would upload this to a storage service
      // For now, we'll just store the file object
      updateData({
        ...data,
        [field]: file,
      })
    }
  }

  const handleImageUrlChange = (e) => {
    const { value } = e.target
    updateData({
      ...data,
      coverImageUrl: value,
    })
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { y: 10, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
  }

  // Add this function inside the EventDetailsForm component
  const validateTimes = () => {
    if (data.startTime && data.endTime) {
      if (data.startTime > data.endTime && startDate?.getTime() === endDate?.getTime()) {
        toast({
          title: "Invalid Time Range",
          description: "End time cannot be earlier than start time.",
          variant: "destructive",
        })
        return false
      }
    }
    return true
  }

  const validateDetailsForm = () => {
    const missingFields = []
    if (!data.name) missingFields.push("Event Name")
    if (!data.displayName) missingFields.push("Event Display Name")
    if (!data.slug) missingFields.push("Website URL Slug")
    return missingFields
  }

  const handleNext = () => {
    if (activeTab === "details") {
      const missingFields = validateDetailsForm()

      if (missingFields.length > 0) {
        toast({
          title: "Required Fields Missing",
          description: `Please fill in the following fields: ${missingFields.join(", ")}`,
          variant: "destructive",
        })
        return
      }

      if (!validateTimes()) {
        return
      }

      setActiveTab("tickets")
    } else if (activeTab === "tickets") {
      // Validate that at least one ticket exists
      if (formData.tickets.length === 0) {
        toast({
          title: "Ticket Required",
          description: "Please add at least one ticket type before proceeding.",
          variant: "destructive",
        })
        return
      }
      setActiveTab("questions")
    } else if (activeTab === "questions") {
      setActiveTab("preview")
    }
  }

  return (
    <motion.div className="space-y-8" variants={container} initial="hidden" animate="show" id="event-details-form">
      <motion.div className="space-y-4" variants={item}>
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Event Type & Visibility
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-4 space-y-3 pt-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-medium">Event Type</h3>
            </div>
            <RadioGroup
              defaultValue={data.type || "Offline"}
              onValueChange={handleTypeChange}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2 rounded-md border p-3 transition-colors hover:bg-muted/50">
                <RadioGroupItem value="Offline" id="offline" />
                <Label htmlFor="offline" className="flex-1 cursor-pointer">
                  Offline
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md border p-3 transition-colors hover:bg-muted/50">
                <RadioGroupItem value="Online" id="online" />
                <Label htmlFor="online" className="flex-1 cursor-pointer">
                  Online
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md border p-3 transition-colors hover:bg-muted/50">
                <RadioGroupItem value="Hybrid" id="hybrid" />
                <Label htmlFor="hybrid" className="flex-1 cursor-pointer">
                  Hybrid
                </Label>
              </div>
            </RadioGroup>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-secondary" />
              </div>
              <h3 className="font-medium">Event Visibility</h3>
            </div>
            <RadioGroup
              defaultValue={data.visibility || "Public"}
              onValueChange={handleVisibilityChange}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2 rounded-md border p-3 transition-colors hover:bg-muted/50">
                <RadioGroupItem value="Public" id="public" />
                <Label htmlFor="public" className="flex-1 cursor-pointer">
                  Public
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md border p-3 transition-colors hover:bg-muted/50">
                <RadioGroupItem value="Private" id="private" />
                <Label htmlFor="private" className="flex-1 cursor-pointer">
                  Private
                </Label>
              </div>
            </RadioGroup>
          </Card>
        </div>
      </motion.div>

      <motion.div className="space-y-4" variants={item}>
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Event Details
        </h2>
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Event Name
              </Label>
              <Input
                id="name"
                name="name"
                value={data.name}
                onChange={handleChange}
                placeholder="Tech Conference 2023"
                className="transition-all focus:ring-2 focus:ring-primary/50"
                required
              />
              <p className="text-xs text-muted-foreground">
                The full name of your event as it will appear on event listings and promotional materials.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium">
                Event Display Name (Short Name)
              </Label>
              <Input
                id="displayName"
                name="displayName"
                value={data.displayName}
                onChange={handleChange}
                placeholder="TC23"
                className="transition-all focus:ring-2 focus:ring-primary/50"
                required
              />
              <p className="text-xs text-muted-foreground">
                A shorter version of your event name for tickets, badges, and places where space is limited.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug" className="text-sm font-medium flex items-center">
              Website URL Slug
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-6 px-2"
                onClick={() => setIsEditingSlug(!isEditingSlug)}
              >
                <Edit className="h-3 w-3" />
                <span className="ml-1 text-xs">{isEditingSlug ? "Auto-generate" : "Edit"}</span>
              </Button>
            </Label>
            <div className="flex items-center">
              <div className="bg-muted px-3 py-2 rounded-l-md border-y border-l text-muted-foreground text-sm">
                {window.location.origin}/events/
              </div>
              <Input
                id="slug"
                name="slug"
                value={data.slug || ""}
                onChange={handleSlugChange}
                placeholder="event-name"
                className="rounded-l-none focus:ring-2 focus:ring-primary/50"
                disabled={!isEditingSlug}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This is the URL where attendees can access your event page. It's automatically generated from your event
              name.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div className="space-y-4" variants={item}>
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Event Schedule
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <CalendarIcon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-medium">Event Dates</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                        !startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => handleDateChange(date, "startDate")}
                      initialFocus
                      disabled={(date) => {
                        // Disable dates in the past
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)

                        // Disable dates more than 1 year in the future
                        const oneYearFromNow = new Date()
                        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

                        return date < today || date > oneYearFromNow
                      }}
                      className="rounded-md border shadow-md"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                        !endDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => handleDateChange(date, "endDate")}
                      initialFocus
                      disabled={(date) => {
                        // Disable dates before the start date
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)

                        // Disable dates more than 1 year in the future
                        const oneYearFromNow = new Date()
                        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

                        // If start date is selected, don't allow end date before start date
                        return (startDate ? date < startDate : date < today) || date > oneYearFromNow
                      }}
                      className="rounded-md border shadow-md"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-secondary" />
              </div>
              <h3 className="font-medium">Event Times</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Start Time</Label>
                <Select value={data.startTime} onValueChange={(value) => handleTimeChange(value, "startTime")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 13 }).map((_, hourOffset) => {
                      const hour = hourOffset + 9 // Start from 9:00
                      return Array.from({ length: 4 }).map((_, minute) => {
                        const h = hour.toString().padStart(2, "0")
                        const m = (minute * 15).toString().padStart(2, "0")
                        const time = `${h}:${m}`
                        return (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        )
                      })
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">End Time</Label>
                <Select value={data.endTime} onValueChange={(value) => handleTimeChange(value, "endTime")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 13 }).map((_, hourOffset) => {
                      const hour = hourOffset + 9 // Start from 9:00
                      return Array.from({ length: 4 }).map((_, minute) => {
                        const h = hour.toString().padStart(2, "0")
                        const m = (minute * 15).toString().padStart(2, "0")
                        const time = `${h}:${m}`
                        return (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        )
                      })
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>

      {(data.type === "Offline" || data.type === "Hybrid") && (
        <motion.div className="space-y-4" variants={item}>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Venue Details
          </h2>
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-medium">Location Information</h3>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="venue" className="text-sm font-medium">
                  Venue Name
                </Label>
                <Input
                  id="venue"
                  name="venue"
                  value={data.venue}
                  onChange={handleChange}
                  placeholder="Convention Center"
                  className="transition-all focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Google Map Location
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={data.address}
                  onChange={handleChange}
                  placeholder="Paste Google Maps URL here"
                  className="transition-all focus:ring-2 focus:ring-primary/50"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Paste a Google Maps URL to show a preview of the location
                </p>

                {data.address && data.address.includes("google.com/maps") && (
                  <div className="mt-3 border rounded-md overflow-hidden">
                    <div className="aspect-video w-full">
                      <iframe
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(data.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        className="w-full h-full border-0"
                        loading="lazy"
                        title="Google Maps Location"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      <motion.div className="space-y-4" variants={item}>
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Event Description
        </h2>
        <Card className="p-4 space-y-3">
          <MarkdownEditor
            value={data.description}
            onChange={(value) =>
              updateData({
                ...data,
                description: value,
              })
            }
            placeholder="Describe your event..."
            minHeight="250px"
          />
        </Card>
      </motion.div>

      <motion.div className="space-y-4" variants={item}>
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Event Cover Image
        </h2>
        <Card className="p-4 space-y-4">
          <Tabs defaultValue={imageUploadMethod} onValueChange={setImageUploadMethod}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Image URL
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Image
              </TabsTrigger>
            </TabsList>
            <TabsContent value="url" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="coverImageUrl">Image URL</Label>
                <Input
                  id="coverImageUrl"
                  name="coverImageUrl"
                  value={data.coverImageUrl}
                  onChange={handleImageUrlChange}
                  placeholder="https://example.com/image.jpg"
                  className="transition-all focus:ring-2 focus:ring-primary/50"
                  required={imageUploadMethod === "url"}
                />
              </div>
              {data.coverImageUrl && (
                <div className="mt-4 border rounded-md overflow-hidden">
                  <img
                    src={data.coverImageUrl || "/placeholder.svg"}
                    alt="Event cover preview"
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src = "/placeholder.svg?key=8ogq3"
                      e.target.alt = "Failed to load image"
                    }}
                  />
                </div>
              )}
            </TabsContent>
            <TabsContent value="upload" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Desktop Cover Image</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="desktopCoverImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "desktopCoverImage")}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("desktopCoverImage").click()}
                    className="w-full button-hover"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Desktop Image
                  </Button>
                </div>
                {data.desktopCoverImage && (
                  <p className="text-sm text-muted-foreground mt-2">Selected: {data.desktopCoverImage.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Mobile Cover Image</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="mobileCoverImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "mobileCoverImage")}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("mobileCoverImage").click()}
                    className="w-full button-hover"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Mobile Image
                  </Button>
                </div>
                {data.mobileCoverImage && (
                  <p className="text-sm text-muted-foreground mt-2">Selected: {data.mobileCoverImage.name}</p>
                )}
              </div>

              <div className="mt-4 border-2 border-dashed border-muted rounded-md p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {data.desktopCoverImage || data.mobileCoverImage
                    ? "Images selected and ready to upload"
                    : "Drag and drop your images here, or click the upload buttons above"}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </motion.div>
      <Button onClick={handleNext}>Next</Button>
    </motion.div>
  )
}
