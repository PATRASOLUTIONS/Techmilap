"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Clock } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
// import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

type EventDetailsFormProps = {
  data: any;
  updateData: (data: any) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  formData: any;
  setFormData: (data: any) => void;
  handleNext: () => void;
  toast: any;
};

// Define the schema for form validation
const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  date: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  startTime: z.string().min(1, { message: "Start time is required" }),
  endTime: z.string().min(1, { message: "End time is required" }),
  location: z.string().optional(), // Made optional, will be conditionally required
  category: z.string().min(1, { message: "Category is required" }),
  image: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .refine((url) => url.startsWith("http://") || url.startsWith("https://"), {
      message: "URL must start with http:// or https://",
    }),
  visibility: z.enum(["Public", "Private"]),
  type: z.enum(["Online", "Offline", "Hybrid"]),
  onlineLink: z.string().url({ message: "Please enter a valid URL for the virtual meeting." }).optional(),
}).superRefine((data, ctx) => {
  if (data.date && data.endDate && data.endDate < data.date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End date cannot be earlier than the start date.",
      path: ["endDate"], // Specify the field this error is associated with
    });
  }
  // Conditionally require location for Offline or Hybrid events
  if ((data.type === "Offline" || data.type === "Hybrid") && (!data.location || data.location.trim().length < 3)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Location must be at least 3 characters for Offline or Hybrid events.",
      path: ["location"],
    });
  }
  // Conditionally require onlineLink for Online or Hybrid events (optional for now, uncomment to make required)
  // if ((data.type === "Online" || data.type === "Hybrid") && (!data.onlineLink || data.onlineLink.trim().length === 0)) {
  //   ctx.addIssue({
  //     code: z.ZodIssueCode.custom,
  //     message: "Virtual Meeting Link is required for Online or Hybrid events.",
  //     path: ["onlineLink"],
  //   });
  // }
});

export function EventDetailsForm({
  data,
  updateData,
  activeTab,
  setActiveTab,
  formData,
  setFormData,
  handleNext,
  toast,
}: EventDetailsFormProps) {
  const [categories, setCategories] = useState<string[]>([]);
  // const [dateOpen, setDateOpen] = useState(false)
  // const [endDateOpen, setEndDateOpen] = useState(false)

  // Initialize the form with default values or initial data
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: data.title || "",
      description: data.description || "",
      date: data.date ? new Date(data.date) : new Date(),
      endDate: data.endDate ? new Date(data.endDate) : new Date(),
      startTime: data.startTime || "09:00",
      endTime: data.endTime || "17:00",
      location: data.location || "",
      category: data.category || "",
      image: data.image || "",
      visibility: data.visibility || "Public",
      type: data.type || "Offline",
      onlineLink: data.onlineLink || "",
    },
  })

  const eventType = form.watch("type");

  // Fetch categories on component mount
  useEffect(() => {
    function fetchCategories() {
      // Set categories manually
      setCategories([
        "Tech & Startups",
        "Finance / FinTech",
        "Education / EdTech",
        "AI / Data Science",
        "Other"
      ]);
      // try {
      //   const response = await fetch("/api/events/categories")
      //   const data = await response.json()
      //   if (data.categories) {
      //     setCategories(data.categories)
      //   }
      // } catch (error) {
      //   console.error("Failed to fetch categories:", error)
      //   setCategories(["Conference", "Workshop", "Networking", "Seminar", "Webinar", "Hackathon", "Meetup", "Other"])
      // }
    }

    fetchCategories()
  }, [])

  // Effect to reset form when 'data' prop changes (e.g., when editing an existing event)
  useEffect(() => {
    if (data) {
      form.reset({
        title: data.title || "",
        description: data.description || "",
        date: data.date ? new Date(data.date) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : new Date(),
        startTime: data.startTime || "09:00",
        endTime: data.endTime || "17:00",
        location: data.location || "",
        category: data.category || "",
        image: data.image || "",
        visibility: data.visibility || "Public",
        type: data.type || "Offline",
        onlineLink: data.onlineLink || "",
      })
    }
    // form.reset is stable, so the effect primarily depends on `data`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, form.reset])


  // Handle form submission
  const handleSubmit = (data) => {
    // Check if the image URL is valid
    if (data.image && !(data.image.startsWith("http://") || data.image.startsWith("https://"))) {
      toast({
        title: "Invalid Image URL",
        description: "Image URL must start with http:// or https://",
        variant: "destructive",
      })
      return
    }

    // Check if visibility is Private and show a toast
    if (data.visibility === "Private") {
      toast({
        title: "Premium Feature",
        description: "Private events are a premium feature. Your event will be set to Public.",
        variant: "default",
      })
      data.visibility = "Public" // Force to Public
    }

    // Pass the validated data to the parent component
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter event title"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e); // update local form state
                    updateData({ ...form.getValues(), title: e.target.value }); // update parent
                  }} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe your event" className="min-h-32"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    updateData({ ...form.getValues(), description: e.target.value });
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      const dateString = e.target.value;
                      const dateObject = dateString ? new Date(dateString) : null;
                      field.onChange(dateObject);
                      updateData({ ...form.getValues(), date: dateObject });
                    }}
                    min={format(new Date(new Date().setHours(0, 0, 0, 0)), "yyyy-MM-dd")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* <div className="grid grid-cols-2 gap-4"> */}
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <div className="flex items-center">
                  {/* <Clock className="mr-2 h-4 w-4 opacity-50" /> */}
                  <Input type="time"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      updateData({ ...form.getValues(), startTime: e.target.value });
                    }} />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* </div> */}

          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> */}
          {/* <div className="grid grid-cols-2 gap-4"> */}
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      const dateString = e.target.value;
                      const dateObject = dateString ? new Date(dateString) : null;
                      field.onChange(dateObject);
                      updateData({ ...form.getValues(), endDate: dateObject });
                    }}
                    min={form.getValues("date") ? format(form.getValues("date"), "yyyy-MM-dd") : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* </div> */}
          {/* <div className="grid grid-cols-2 gap-4"> */}
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <div className="flex items-center">
                  {/* <Clock className="mr-2 h-4 w-4 opacity-50" /> */}
                  <Input type="time"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      updateData({ ...form.getValues(), endTime: e.target.value });
                    }} />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* </div> */}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(eventType === "Offline" || eventType === "Hybrid") && (
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Event location or address"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        updateData({ ...form.getValues(), location: e.target.value });
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {(eventType === "Online" || eventType === "Hybrid") && (
            <FormField
              control={form.control}
              name="onlineLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Virtual Meeting Link</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/meeting-link"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        updateData({ ...form.getValues(), onlineLink: e.target.value });
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      updateData({ ...form.getValues(), category: e.target.value });
                    }}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/image.jpg"
                    {...field}
                    required
                    onChange={(e) => {
                      field.onChange(e);
                      updateData({ ...form.getValues(), image: e.target.value });
                    }}
                  />
                </FormControl>
                <FormDescription>Enter a valid URL starting with http:// or https://</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Visibility</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(val) => {
                        field.onChange(val);
                        updateData({ ...form.getValues(), visibility: val });
                      }}
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Public" />
                        </FormControl>
                        <FormLabel className="font-normal">Public</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Private" disabled />
                        </FormControl>
                        <FormLabel className="font-normal text-muted-foreground">Private (Premium feature)</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Event Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(val) => {
                        field.onChange(val);
                        updateData({ ...form.getValues(), type: val });
                      }}
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Offline" />
                        </FormControl>
                        <FormLabel className="font-normal">In-person</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Online" />
                        </FormControl>
                        <FormLabel className="font-normal">Online</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Hybrid" />
                        </FormControl>
                        <FormLabel className="font-normal">Hybrid</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </form>
    </Form>
  )
}
