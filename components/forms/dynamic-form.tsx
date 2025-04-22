"use client"

import { useState } from "react"
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
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface DynamicFormProps {
  formFields: any[]
  formTitle: string
  formDescription: string
  onSubmit: (data: any) => Promise<void>
  defaultValues?: Record<string, any>
  submitButtonText?: string
  isSubmitting?: boolean
}

export function DynamicForm({
  formFields,
  formTitle,
  formDescription,
  onSubmit,
  defaultValues = {},
  submitButtonText = "Submit",
  isSubmitting = false,
}: DynamicFormProps) {
  const [localSubmitting, setLocalSubmitting] = useState(false)
  const { toast } = useToast()

  // Ensure formFields is always an array
  const safeFormFields = Array.isArray(formFields) ? formFields : []

  // Dynamically build the form schema based on form fields
  const buildFormSchema = () => {
    const schema: Record<string, any> = {}

    safeFormFields.forEach((field) => {
      if (!field || !field.id || !field.type) {
        console.warn("Invalid field configuration:", field)
        return
      }

      let fieldSchema = z.string()

      if (field.type === "email") {
        fieldSchema = z.string().email(`${field.label} must be a valid email`)
      } else if (field.type === "checkbox") {
        fieldSchema = z.boolean().optional()
      } else if (field.type === "date") {
        fieldSchema = z.date().optional()
      }

      if (field.required && field.type !== "checkbox" && field.type !== "date") {
        fieldSchema = fieldSchema.min(1, `${field.label} is required`)
      } else if (field.required && field.type === "checkbox") {
        fieldSchema = z.literal(true, {
          errorMap: () => ({ message: `${field.label} is required` }),
        })
      } else if (field.required && field.type === "date") {
        fieldSchema = z.date({
          required_error: `${field.label} is required`,
        })
      } else {
        fieldSchema = fieldSchema.optional()
      }

      schema[field.id] = fieldSchema
    })

    return z.object(schema)
  }

  // Create the form
  const form = useForm({
    resolver: zodResolver(buildFormSchema()),
    defaultValues: {
      ...defaultValues,
    },
  })

  const handleSubmit = async (values: any) => {
    try {
      setLocalSubmitting(true)
      console.log("Form submitted with values:", values)

      // Clean the data to ensure no undefined values
      const cleanData = {}
      Object.keys(values).forEach((key) => {
        // Handle different types of values appropriately
        if (values[key] === undefined || values[key] === null) {
          cleanData[key] = ""
        } else if (values[key] instanceof Date) {
          cleanData[key] = values[key].toISOString()
        } else {
          cleanData[key] = values[key]
        }
      })

      console.log("Sending data to parent component:", cleanData)
      await onSubmit(cleanData)
    } catch (error) {
      console.error("Form submission error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit form. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLocalSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{formTitle}</h2>
        <p className="text-muted-foreground">{formDescription}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {safeFormFields.map((field) => {
            // Skip rendering if field is invalid
            if (!field || !field.id || !field.type) {
              return null
            }

            return (
              <FormField
                key={field.id}
                control={form.control}
                name={field.id}
                render={({ field: formField }) => (
                  <FormItem>
                    {field.type !== "checkbox" && (
                      <FormLabel>
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </FormLabel>
                    )}
                    <FormControl>{renderFormControl(field, formField)}</FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )
          })}

          <Button type="submit" className="w-full" disabled={isSubmitting || localSubmitting}>
            {isSubmitting || localSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              submitButtonText
            )}
          </Button>
        </form>
      </Form>
    </div>
  )

  // Helper function to render the appropriate form control based on field type
  function renderFormControl(field: any, formField: any) {
    // Safety check for field
    if (!field || !field.type) {
      return <Input {...formField} disabled placeholder="Invalid field configuration" />
    }

    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            placeholder={field.placeholder || `Enter ${field.label?.toLowerCase() || "information"}`}
            {...formField}
            className="min-h-[100px]"
            value={formField.value || ""}
          />
        )

      case "select":
        return (
          <Select onValueChange={formField.onChange} defaultValue={formField.value}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || `Select ${field.label?.toLowerCase() || "option"}`} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((option: any) => {
                // Safety check for option
                if (!option) return null
                const optionId = option.id || option.value || String(Math.random())
                const optionValue = option.value || ""

                return (
                  <SelectItem key={optionId} value={optionValue}>
                    {optionValue}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        )

      case "radio":
        return (
          <RadioGroup
            onValueChange={formField.onChange}
            defaultValue={formField.value}
            className="flex flex-col space-y-1"
            value={formField.value || ""}
          >
            {(field.options || []).map((option: any) => {
              // Safety check for option
              if (!option) return null
              const optionId = option.id || option.value || String(Math.random())
              const optionValue = option.value || ""

              return (
                <div key={optionId} className="flex items-center space-x-2">
                  <RadioGroupItem value={optionValue} id={`${field.id}-${optionId}`} />
                  <label htmlFor={`${field.id}-${optionId}`}>{optionValue}</label>
                </div>
              )
            })}
          </RadioGroup>
        )

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox id={field.id} checked={formField.value || false} onCheckedChange={formField.onChange} />
            <label
              htmlFor={field.id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {field.label || ""}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </label>
          </div>
        )

      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formField.value && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formField.value ? format(formField.value, "PPP") : field.placeholder || "Select a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={formField.value} onSelect={formField.onChange} initialFocus />
            </PopoverContent>
          </Popover>
        )

      case "email":
        return (
          <Input
            type="email"
            placeholder={field.placeholder || `Enter ${field.label?.toLowerCase() || "email"}`}
            {...formField}
            value={formField.value || ""}
          />
        )

      case "phone":
        return (
          <Input
            type="tel"
            placeholder={field.placeholder || "Enter phone number"}
            {...formField}
            value={formField.value || ""}
          />
        )

      default:
        return (
          <Input
            placeholder={field.placeholder || `Enter ${field.label?.toLowerCase() || "information"}`}
            {...formField}
            value={formField.value || ""}
          />
        )
    }
  }
}
