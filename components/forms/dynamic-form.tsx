"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface DynamicFormProps {
  formFields: any[]
  formTitle?: string
  formDescription?: string
  onSubmit: (data: any) => void
  submitButtonText?: string
  isSubmitting?: boolean
  className?: string
}

export function DynamicForm({
  formFields,
  formTitle,
  formDescription,
  onSubmit,
  submitButtonText = "Submit",
  isSubmitting = false,
  className,
}: DynamicFormProps) {
  const [formError, setFormError] = useState<string | null>(null)

  // Create a dynamic schema based on the form fields
  const createFormSchema = () => {
    const schemaFields: Record<string, any> = {}

    formFields.forEach((field) => {
      let validator

      switch (field.type) {
        case "email":
          validator = z.string().email({ message: "Please enter a valid email address" })
          break
        case "number":
          validator = z.string().refine((val) => !isNaN(Number(val)), {
            message: "Please enter a valid number",
          })
          break
        case "tel":
        case "phone":
          validator = z
            .string()
            .min(5, { message: "Phone number is too short" })
            .max(20, { message: "Phone number is too long" })
            .refine(
              (val) => {
                // Basic phone validation - allows various formats
                return /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/.test(val)
              },
              { message: "Please enter a valid phone number" },
            )
          break
        case "checkbox":
          validator = z.boolean().optional()
          break
        case "select":
        case "radio":
          validator = z.string().min(1, { message: "Please select an option" })
          break
        case "textarea":
          validator = z
            .string()
            .min(field.minLength || 1, {
              message: `Please enter at least ${field.minLength || 1} characters`,
            })
            .max(field.maxLength || 1000, {
              message: `Text cannot exceed ${field.maxLength || 1000} characters`,
            })
          break
        case "text":
        default:
          validator = z
            .string()
            .min(field.minLength || 1, {
              message: `Please enter at least ${field.minLength || 1} characters`,
            })
            .max(field.maxLength || 100, {
              message: `Text cannot exceed ${field.maxLength || 100} characters`,
            })
          break
      }

      // Make the field optional if not required
      if (!field.required) {
        validator = validator.optional()
      }

      schemaFields[field.id] = validator
    })

    return z.object(schemaFields)
  }

  const formSchema = createFormSchema()

  // Create the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: formFields.reduce((acc, field) => {
      if (field.type === "checkbox") {
        acc[field.id] = field.defaultValue || false
      } else {
        acc[field.id] = field.defaultValue || ""
      }
      return acc
    }, {}),
  })

  // Handle form submission
  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setFormError(null)
      await onSubmit(data)
    } catch (error) {
      console.error("Form submission error:", error)
      setFormError(error instanceof Error ? error.message : "An error occurred while submitting the form")
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {formTitle && <h3 className="text-lg font-medium">{formTitle}</h3>}
      {formDescription && <p className="text-sm text-gray-500">{formDescription}</p>}

      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="text-sm">{formError}</p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {formFields.map((field) => (
            <FormField
              key={field.id}
              control={form.control}
              name={field.id}
              render={({ field: formField }) => (
                <FormItem>
                  <FormLabel>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </FormLabel>
                  <FormControl>
                    {(() => {
                      switch (field.type) {
                        case "textarea":
                          return (
                            <Textarea
                              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                              {...formField}
                              value={formField.value || ""}
                            />
                          )
                        case "select":
                          return (
                            <Select
                              onValueChange={formField.onChange}
                              defaultValue={formField.value || ""}
                              value={formField.value || ""}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options?.map((option) => (
                                  <SelectItem key={option.id || option.value} value={option.id || option.value}>
                                    {option.label || option.value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )
                        case "radio":
                          return (
                            <RadioGroup
                              onValueChange={formField.onChange}
                              defaultValue={formField.value || ""}
                              value={formField.value || ""}
                              className="flex flex-col space-y-1"
                            >
                              {field.options?.map((option) => (
                                <div key={option.id || option.value} className="flex items-center space-x-2">
                                  <RadioGroupItem value={option.id || option.value} id={option.id || option.value} />
                                  <label
                                    htmlFor={option.id || option.value}
                                    className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {option.label || option.value}
                                  </label>
                                </div>
                              ))}
                            </RadioGroup>
                          )
                        case "checkbox":
                          return (
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={formField.value || false}
                                onCheckedChange={formField.onChange}
                                id={field.id}
                              />
                              <label
                                htmlFor={field.id}
                                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {field.checkboxLabel || field.label}
                              </label>
                            </div>
                          )
                        case "email":
                          return (
                            <Input
                              type="email"
                              placeholder={field.placeholder || `Enter your email`}
                              {...formField}
                              value={formField.value || ""}
                            />
                          )
                        case "tel":
                        case "phone":
                          return (
                            <Input
                              type="tel"
                              placeholder={field.placeholder || `Enter your phone number`}
                              {...formField}
                              value={formField.value || ""}
                            />
                          )
                        case "number":
                          return (
                            <Input
                              type="number"
                              placeholder={field.placeholder || `Enter a number`}
                              {...formField}
                              value={formField.value || ""}
                            />
                          )
                        case "text":
                        default:
                          return (
                            <Input
                              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                              {...formField}
                              value={formField.value || ""}
                            />
                          )
                      }
                    })()}
                  </FormControl>
                  {field.description && <FormDescription>{field.description}</FormDescription>}
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <Button type="submit" className="w-full bg-brand-blue hover:bg-brand-blue/90" disabled={isSubmitting}>
            {isSubmitting ? (
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
