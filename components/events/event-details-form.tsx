"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon, MapPin, Globe, Users, Edit } from "lucide-react"
import { format, addDays } from "date-fns"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { MarkdownEditor } from "@/components/ui/markdown-editor"
import type { DateRange } from "react-day-picker"

export function EventDetailsForm({ data, updateData, activeTab, setActiveTab, formData, toast }) {
  const [startDate, setStartDate] = useState(data.startDate ? new Date(data.startDate) : undefined)
  const [endDate, setEndDate] = useState(data.endDate ? new Date(data.endDate) : undefined)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    startDate && endDate
      ? {
          from: startDate,
          to: endDate,
        }
      : undefined,
  )
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

    // Update date range when start or end date changes
    if (data.startDate && data.endDate) {
      setDateRange({
        from: new Date(data.startDate),
        to: new Date(data.endDate),
      })
    } else if (data.startDate) {
      setDateRange({
        from: new Date(data.startDate),
        to: undefined,
      })
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

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from) {
      setDateRange(range)
      setStartDate(range.from)
      updateData({
        ...data,
        startDate: range.from.toISOString(),
        endDate: range.to ? range.to.toISOString() : range.from.toISOString(),
      })

      if (range.to) {
        setEndDate(range.to)
      } else {
        setEndDate(range.from)
      }
    } else {
      setDateRange(undefined)
      setStartDate(undefined)
      setEndDate(undefined)
      updateData({
        ...data,
        startDate: "",
        endDate: "",
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
        <div className="grid gap-6">
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <CalendarIcon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-medium">Event Dates</h3>
            </div>

            {/* New Date Range Picker */}
            <div className="grid gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                      !dateRange && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Select event date(s)</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={handleDateRangeChange}
                    numberOfMonths={2}
                    disabled={(date) => {
                      // Disable dates in the past
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)

                      // Disable dates more than 1 year in the future
                      const oneYearFromNow = new Date()
                      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

                      return date < today || date > oneYearFromNow
                    }}
                    className="rounded-md border shadow-md p-3"
                  />
                  <div className="p-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">Select a date range for your event</div>
                      <div className="space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const today = new Date()
                            const nextWeek = addDays(today, 7)
                            handleDateRangeChange({
                              from: today,
                              to: nextWeek,
                            })
                          }}
                        >
                          Next 7 days
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const today = new Date()
                            handleDateRangeChange({
                              from: today,
                              to: today,
                            })
                          }}
                        >
                          Today
                        </Button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

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
            </div>
          </Card>
        </div>
      </motion.div>

      {(data.type === "Offline" || data.type === "Hybrid") && (
        <motion.div className="space-y-4" variants={item}>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Google Map Location
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
                />
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
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="coverImageUrl">Image URL</Label>
              <Input
                id="coverImageUrl"
                name="coverImageUrl"
                value={data.coverImageUrl}
                onChange={handleImageUrlChange}
                placeholder="https://example.com/image.jpg"
                className="transition-all focus:ring-2 focus:ring-primary/50"
                required
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
          </div>
        </Card>
      </motion.div>
      <Button onClick={handleNext}>Next</Button>
    </motion.div>
  )
}
