"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react" // Add this import
import { CardContent } from "@/components/ui/card"

interface PublicEventRegistrationFormProps {
  eventId: string
  onSuccess: () => void
  customQuestions?: any[]
}

export function PublicEventRegistrationForm({
  eventId,
  onSuccess,
  customQuestions = [],
}: PublicEventRegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [eventData, setEventData] = useState<any>(null)
  const { toast } = useToast()
  const { data: session } = useSession() // Add this line to get session data

  // Fetch event data including custom questions if not provided
  useEffect(() => {
    const fetchEventData = async () => {
      if (customQuestions.length > 0) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/events/${eventId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch event data")
        }

        const data = await response.json()
        setEventData(data.event)
      } catch (error) {
        console.error("Error fetching event data:", error)
        toast({
          title: "Error",
          description: "Failed to load event registration form",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchEventData()
  }, [eventId, customQuestions, toast])

  // Dynamically build the form schema based on custom questions
  const buildFormSchema = () => {
    const baseSchema = {
      firstName: z.string().min(1, {
        message: "First name must be at least 1 characters.",
      }),
      lastName: z.string().min(1, {
        message: "Last name must be at least 1 characters.",
      }),
      email: z.string().email({
        message: "Please enter a valid email address.",
      }),
      phone: z.string().optional(),
    }

    const questions = customQuestions.length > 0 ? customQuestions : eventData?.customQuestions?.attendee || []

    const customFieldsSchema = {}

    questions.forEach((question) => {
      const fieldName = `custom_${question.id}`

      let fieldSchema = z.string()

      if (question.type === "email") {
        fieldSchema = z.string().email({
          message: `${question.label} must be a valid email`,
        })
      }

      if (question.required) {
        fieldSchema = fieldSchema.min(1, {
          message: `${question.label} is required`,
        })
      } else {
        fieldSchema = fieldSchema.optional()
      }

      customFieldsSchema[fieldName] = fieldSchema
    })

    return z.object({
      ...baseSchema,
      ...customFieldsSchema,
    })
  }

  // Create the form
  const form = useForm({
    resolver: zodResolver(buildFormSchema()),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  })

  // Reset form when event data changes
  useEffect(() => {
    if (eventData || customQuestions.length > 0) {
      // If user is logged in, pre-fill the email field
      if (session?.user?.email) {
        form.setValue("email", session.user.email)

        // If we have user's name, pre-fill those fields too
        if (session.user.name) {
          const nameParts = session.user.name.split(" ")
          if (nameParts.length > 0) {
            form.setValue("firstName", nameParts[0])

            if (nameParts.length > 1) {
              form.setValue("lastName", nameParts.slice(1).join(" "))
            }
          }
        }
      }

      form.reset(form.getValues())
    }
  }, [eventData, customQuestions, form, session])

  async function onSubmit(values) {
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/events/${eventId}/public-register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          // Explicitly set the status to pending for attendee registrations
          status: "pending",
        }),
      })

      if (!response.ok) {
        // Read the error message from the response body
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to register for event")
      }

      toast({
        title: "Registration submitted",
        description: "Your registration has been submitted and is pending approval.",
      })

      onSuccess()
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to register for this event. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    )
  }

  // Get the questions from props or event data
  const questions = customQuestions.length > 0 ? customQuestions : eventData?.customQuestions?.attendee || []

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john.doe@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 123-4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Render custom questions */}
          {questions.map((question) => {
            const fieldName = `custom_${question.id}`

            // Register the field if it doesn't exist
            if (!form.getValues(fieldName)) {
              form.register(fieldName)
            }

            return (
              <FormField
                key={question.id}
                control={form.control}
                name={fieldName}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {question.label}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </FormLabel>
                    <FormControl>{renderFormControl(question, field)}</FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )
          })}
        </CardContent>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Register"}
        </Button>
      </form>
    </Form>
  )

  // Helper function to render the appropriate form control based on question type
  function renderFormControl(question, field) {
    switch (question.type) {
      case "textarea":
        return <Textarea placeholder={question.placeholder || `Enter ${question.label.toLowerCase()}`} {...field} />

      case "select":
        return (
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <SelectTrigger>
              <SelectValue placeholder={question.placeholder || `Select ${question.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem key={option.id} value={option.value}>
                  {option.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "radio":
        return (
          <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
            {question.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${question.id}-${option.id}`} />
                <label htmlFor={`${question.id}-${option.id}`}>{option.value}</label>
              </div>
            ))}
          </RadioGroup>
        )

      case "checkbox":
        return (
          <div className="flex flex-col space-y-2">
            {question.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${option.id}`}
                  onCheckedChange={(checked) => {
                    const currentValue = field.value ? field.value.split(",") : []
                    if (checked) {
                      if (!currentValue.includes(option.value)) {
                        field.onChange([...currentValue, option.value].join(","))
                      }
                    } else {
                      field.onChange(currentValue.filter((v) => v !== option.value).join(","))
                    }
                  }}
                  checked={(field.value || "").split(",").includes(option.value)}
                />
                <label htmlFor={`${question.id}-${option.id}`}>{option.value}</label>
              </div>
            ))}
          </div>
        )

      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {field.value ? format(new Date(field.value), "PPP") : question.placeholder || "Select a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={field.value ? new Date(field.value) : undefined}
                onSelect={(date) => field.onChange(date ? date.toISOString() : "")}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )

      case "email":
        return (
          <Input
            type="email"
            placeholder={question.placeholder || `Enter ${question.label.toLowerCase()}`}
            {...field}
          />
        )

      case "phone":
        return <Input type="tel" placeholder={question.placeholder || "Enter phone number"} {...field} />

      default:
        return <Input placeholder={question.placeholder || `Enter ${question.label.toLowerCase()}`} {...field} />
    }
  }
}
