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
import { validateField, getValidationType } from "@/lib/form-validation"

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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

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
      } else if (
        field.type === "phone" ||
        field.label?.toLowerCase().includes("phone") ||
        field.label?.toLowerCase().includes("mobile")
      ) {
        fieldSchema = z
          .string()
          .regex(
            /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
            `${field.label} must be a valid phone number`,
          )
      } else if (field.label?.toLowerCase().includes("linkedin")) {
        fieldSchema = z
          .string()
          .regex(
            /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/,
            `${field.label} must be a valid LinkedIn profile URL`,
          )
      } else if (field.label?.toLowerCase().includes("github")) {
        fieldSchema = z
          .string()
          .regex(
            /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/,
            `${field.label} must be a valid GitHub profile URL`,
          )
      } else if (field.validation?.pattern) {
        // Use custom validation pattern if provided
        fieldSchema = z
          .string()
          .regex(field.validation.pattern, field.validation.message || `${field.label} is invalid`)
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

  const validateForm = () => {
    const errors: Record<string, string> = {}

    safeFormFields.forEach((question) => {
      const value = form.getValues(question.id) || ""
      const validationType = getValidationType(question)
      const error = validateField(validationType, value, question.required)

      if (error) {
        errors[question.id] = error
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (values: any) => {
    try {
      setLocalSubmitting(true)
      console.log("Form submitted with values:", values)

      // Validate the form
      const isValid = validateForm()
      if (!isValid) {
        setLocalSubmitting(false)
        return
      }

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

  const handleBlur = (questionId: string) => {
    const question = safeFormFields.find((q) => q.id === questionId)
    if (!question) return

    const value = form.getValues(questionId) || ""
    const validationType = getValidationType(question)
    const error = validateField(validationType, value, question.required)

    setValidationErrors((prev) => ({
      ...prev,
      [questionId]: error || "",
    }))
  }

  const renderFormControl = (field: any, formField: any) => {
    const error = validationErrors[field.id]

    switch (field.type) {
      case "text":
      case "email":
      case "password":
      case "phone":
        return (
          <Input
            type={field.type}
            placeholder={field.placeholder}
            {...formField}
            onBlur={() => handleBlur(field.id)}
            className={error ? "border-red-500" : ""}
          />
        )
      case "textarea":
        return (
          <Textarea
            placeholder={field.placeholder}
            {...formField}
            onBlur={() => handleBlur(field.id)}
            className={error ? "border-red-500" : ""}
          />
        )
      case "select":
        return (
          <Select
            onValueChange={(value) => {
              formField.onChange(value)
              handleBlur(field.id)
            }}
            defaultValue={formField.value}
          >
            <FormControl>
              <SelectTrigger className={error ? "border-red-500" : ""}>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {field.options.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case "checkbox":
        return (
          <div className="flex flex-col space-y-2">
            {field.options?.map((option) => {
              // Ensure we're working with arrays for checkbox values
              const currentValues = formField.value
                ? typeof formField.value === "string"
                  ? formField.value.split(",")
                  : [formField.value]
                : []

              return (
                <div key={option.value || option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${option.value || option.id}`}
                    onCheckedChange={(checked) => {
                      try {
                        // Create a new array from current values
                        const valueArray = [...currentValues]

                        if (checked) {
                          // Add value if not already present
                          if (!valueArray.includes(option.value)) {
                            valueArray.push(option.value)
                          }
                        } else {
                          // Remove value if present
                          const index = valueArray.indexOf(option.value)
                          if (index !== -1) {
                            valueArray.splice(index, 1)
                          }
                        }

                        // Join back to string and update
                        formField.onChange(valueArray.join(","))
                        handleBlur(field.id)
                      } catch (error) {
                        console.error("Error handling checkbox change:", error)
                      }
                    }}
                    checked={currentValues.includes(option.value)}
                  />
                  <label htmlFor={`${field.id}-${option.value || option.id}`} className="text-sm">
                    {option.label || option.value}
                  </label>
                </div>
              )
            })}
          </div>
        )
      case "radio":
        return (
          <RadioGroup onValueChange={formField.onChange} defaultValue={formField.value}>
            <div className="flex flex-col space-y-1">
              {field.options.map((option: any) => (
                <FormItem key={option.value} className="flex items-center space-x-2">
                  <FormControl>
                    <RadioGroupItem value={option.value} id={option.value} />
                  </FormControl>
                  <FormLabel htmlFor={option.value}>{option.label}</FormLabel>
                </FormItem>
              ))}
            </div>
          </RadioGroup>
        )
      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !formField.value && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formField.value ? format(formField.value, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formField.value}
                onSelect={formField.onChange}
                disabled={(date) => date > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )
      default:
        return null
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
                    {validationErrors[field.id] && <p className="text-sm text-red-500">{validationErrors[field.id]}</p>}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )
          })}

          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                name="terms"
                required
                onCheckedChange={(checked) => {
                  // You can add additional logic here if needed
                }}
              />
              <label htmlFor="terms" className="text-sm">
                I agree to the{" "}
                <a
                  href="/event-terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Terms and Conditions
                </a>
              </label>
            </div>
          </div>

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
}
