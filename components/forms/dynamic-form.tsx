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
import { CalendarIcon, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { validateField, getValidationType } from "@/lib/form-validation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [formError, setFormError] = useState("")
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

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
        // For checkbox fields, we accept boolean, string, or array
        fieldSchema = z.union([z.boolean(), z.string(), z.array(z.string())]).optional()
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
        // For required checkboxes, we need special handling
        if (field.options && field.options.length > 0) {
          // For multi-checkboxes, at least one must be selected
          fieldSchema = z.union([z.literal(true), z.string().min(1), z.array(z.string()).min(1)], {
            errorMap: () => ({ message: `${field.label} is required` }),
          })
        } else {
          // For single checkboxes, it must be true
          fieldSchema = z.literal(true, {
            errorMap: () => ({ message: `${field.label} is required` }),
          })
        }
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
      const value = form.getValues(question.id)
      const validationType = getValidationType(question)

      // Only call validateField with string values or convert to string
      let valueToValidate = value
      if (typeof value !== "string" && value !== null && value !== undefined) {
        valueToValidate = String(value)
      }

      const error = validateField(validationType, valueToValidate, question.required)

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
      setFormError("") // Clear any previous form errors
      setDebugInfo(null) // Clear any previous debug info
      console.log("Form submitted with values:", values)

      // Validate the form
      const isValid = validateForm()
      if (!isValid) {
        setLocalSubmitting(false)
        setFormError("Please correct the errors in the form before submitting.")
        return
      }

      // Check if terms are accepted
      if (!termsAccepted) {
        setFormError("You must accept the terms and conditions to proceed.")
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

      // Add terms acceptance
      cleanData["termsAccepted"] = termsAccepted

      // Add firstName and lastName if they don't exist but name does
      if (!cleanData["firstName"] && !cleanData["lastName"] && cleanData["name"]) {
        const nameParts = cleanData["name"].split(" ")
        if (nameParts.length > 0) {
          cleanData["firstName"] = nameParts[0]
          if (nameParts.length > 1) {
            cleanData["lastName"] = nameParts.slice(1).join(" ")
          }
        }
      }

      // Add name if it doesn't exist but firstName does
      if (!cleanData["name"] && cleanData["firstName"]) {
        cleanData["name"] = `${cleanData["firstName"]} ${cleanData["lastName"] || ""}`.trim()
      }

      console.log("Sending data to parent component:", cleanData)
      await onSubmit(cleanData)
    } catch (error: any) {
      console.error("Form submission error:", error)

      // Set a user-friendly error message
      setFormError(error instanceof Error ? error.message : "Failed to submit form. Please try again.")

      // Set debug info if available
      if (error.cause || error.details) {
        setDebugInfo(JSON.stringify(error.cause || error.details, null, 2))
      }

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

    const value = form.getValues(questionId)
    const validationType = getValidationType(question)

    // Only call validateField with string values or convert to string
    let valueToValidate = value
    if (typeof value !== "string" && value !== null && value !== undefined) {
      valueToValidate = String(value)
    }

    const error = validateField(validationType, valueToValidate, question.required)

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
                  {option.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case "checkbox":
        // Handle single checkbox (no options array)
        if (!field.options || !Array.isArray(field.options) || field.options.length === 0) {
          return (
            <div className="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  checked={!!formField.value}
                  onCheckedChange={formField.onChange}
                  className={error ? "border-red-500" : ""}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </FormLabel>
              </div>
            </div>
          )
        }

        // Handle multiple checkboxes (options array)
        return (
          <div className="flex flex-col space-y-2">
            {field.options.map((option: any) => {
              const optionValue = option.value || option.id || ""
              const optionLabel = option.label || option.value || ""

              return (
                <div key={optionValue} className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={
                        Array.isArray(formField.value)
                          ? formField.value.includes(optionValue)
                          : typeof formField.value === "string"
                            ? formField.value.split(",").includes(optionValue)
                            : false
                      }
                      onCheckedChange={(checked) => {
                        let newValue

                        // Handle array values
                        if (Array.isArray(formField.value)) {
                          newValue = [...formField.value]
                          if (checked) {
                            if (!newValue.includes(optionValue)) {
                              newValue.push(optionValue)
                            }
                          } else {
                            newValue = newValue.filter((v) => v !== optionValue)
                          }
                        }
                        // Handle string values (comma-separated)
                        else if (typeof formField.value === "string") {
                          const values = formField.value ? formField.value.split(",") : []
                          if (checked) {
                            if (!values.includes(optionValue)) {
                              values.push(optionValue)
                            }
                          } else {
                            const index = values.indexOf(optionValue)
                            if (index !== -1) {
                              values.splice(index, 1)
                            }
                          }
                          newValue = values.join(",")
                        }
                        // Handle empty/undefined values
                        else {
                          newValue = checked ? optionValue : ""
                        }

                        formField.onChange(newValue)
                      }}
                      className={error ? "border-red-500" : ""}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal">{optionLabel}</FormLabel>
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
                  <FormLabel htmlFor={option.value}>{option.value}</FormLabel>
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

      {/* Display form-level error if any */}
      {formError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>

          {debugInfo && (
            <div className="mt-2">
              <details>
                <summary className="cursor-pointer text-sm font-medium">Technical Details</summary>
                <pre className="whitespace-pre-wrap text-xs mt-2 p-2 bg-gray-100 rounded">{debugInfo}</pre>
              </details>
            </div>
          )}
        </Alert>
      )}

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
                checked={termsAccepted}
                onCheckedChange={(checked) => {
                  setTermsAccepted(checked === true)
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
