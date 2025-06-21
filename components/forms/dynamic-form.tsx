"use client"
import React, { useState, useMemo, useEffect } from "react"
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
import { format } from "date-fns"
import { Loader2, AlertCircle, CalendarIcon } from "lucide-react"
import { validateField, getValidationType } from "@/lib/form-validation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { logWithTimestamp } from "@/utils/logger"
import { useSession } from "next-auth/react"

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
  logWithTimestamp("info", "form fields", formFields)
  logWithTimestamp("info", "formTitle", formTitle)
  logWithTimestamp("info", "formDescription", formDescription)

  const { data: session, update: updateSession } = useSession();
  const [localSubmitting, setLocalSubmitting] = useState(false)
  const { toast } = useToast()
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [formError, setFormError] = useState("")
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [fetchedUserProfile, setFetchedUserProfile] = useState<Record<string, any> | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

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
        // fieldSchema = z
        //   .string()
        //   .trim()
        //   .regex(
        //     /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/i,
        //     `${field.label} must be a valid LinkedIn profile URL`,
        //   )
      } else if (field.label?.toLowerCase().includes("github")) {
        // console.log(field)
        // fieldSchema = z
        //   .string()
        //   .trim()
        //   .regex(
        //     /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/i,
        //     `${field.label} must be a valid GitHub profile URL`,
        //   )
      } else if(field.label?.toLowerCase().includes("mvp")) {
        // fieldSchema = z
        //   .string()
        //   .regex(
        //     /^https?:\/\/mvp\.microsoft\.com\/[a-zA-Z-]+\/MVP\/profile\/[a-fA-F0-9-]+\/?$/, 
        //     `${field.label} must be a valid MVP profile URL`
        //   )
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

  // Effect to fetch user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (session?.user?.id) {
        setIsLoadingProfile(true);
        try {
          const response = await fetch(`/api/users/${session.user.id}`);
          if (response.ok) {
            const profileData = await response.json();
            console.log("Fetched user profile:", profileData.user);
            setFetchedUserProfile(profileData.user); // Assuming API returns { user: data }
          } else {
            console.error("Failed to fetch user profile:", response.statusText);
            toast({ title: "Error", description: "Could not load your profile data.", variant: "destructive" });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          toast({ title: "Error", description: "An error occurred while loading your profile.", variant: "destructive" });
        } finally {
          setIsLoadingProfile(false);
        }
      }
    };
    loadUserProfile();
  }, [session?.user?.id, toast]);

  // Create the form
  // Moved this up so 'form' is initialized before the useEffect that uses it.
  const form = useForm({
    resolver: zodResolver(buildFormSchema()),
    defaultValues: useMemo(() => {
      const initialValues = { ...defaultValues };

      // Ensure all text-based fields have a default empty string if not already defined
      safeFormFields.forEach(field => {
        if (
          (field.type === "text" || field.type === "email" || field.type === "phone" || field.type === "textarea") &&
          initialValues[field.id] === undefined
        ) {
          initialValues[field.id] = "";
        }
      });

      safeFormFields.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(defaultValues, field.id)) {
          initialValues[field.id] = defaultValues[field.id];
        }
      });
      return initialValues;
    }, [safeFormFields, defaultValues]),
  });

  // Effect to reset form with fetched profile data
  useEffect(() => {
    if (fetchedUserProfile) {
      const newDefaultValues: Record<string, any> = { ...defaultValues }; // Start with prop defaultValues
      safeFormFields.forEach(field => {
        if (field.id.includes('.')) {
          const parts = field.id.split('.');
          let currentValue = fetchedUserProfile;
          for (const part of parts) {
            if (currentValue && typeof currentValue === 'object' && Object.prototype.hasOwnProperty.call(currentValue, part)) {
              currentValue = currentValue[part];
            } else {
              currentValue = undefined; // Path doesn't exist or value is undefined
              break;
            }
          }
          newDefaultValues[field.id] = currentValue ?? ''; // Use empty string if undefined/null
        } else if (Object.prototype.hasOwnProperty.call(fetchedUserProfile, field.id)) {
          newDefaultValues[field.id] = fetchedUserProfile[field.id] ?? ''; // Use empty string if undefined/null
        }
      });
      form.reset(newDefaultValues);
    }
  }, [fetchedUserProfile]); // form.reset is stable, form itself is not

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
      console.log("Error", error, validationType, valueToValidate, question.required)

      if (error) {
        errors[question.id] = error
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (values: any) => {
    logWithTimestamp("info", "form values", values)

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

      // After successful primary submission, attempt to update user profile
      if (session?.user?.id && fetchedUserProfile) {
        const profileDataToUpdate: Record<string, any> = {};
        const socialDataToUpdate: Record<string, any> = {}; // For social fields

        for (const key in cleanData) {
          const formFieldDefinition = safeFormFields.find(f => f.id === key);
          if (formFieldDefinition) {
            // Exclude non-editable fields (name, email) from profile update payload
            if (key === 'name' || key === 'email') {
              continue;
            }

            if (key.startsWith('social.')) {
              const socialFieldKey = key.substring('social.'.length); // e.g., 'twitter'
              // Compare with fetchedUserProfile.social?.<socialFieldKey> or empty string if not present
              if (cleanData[key] !== (fetchedUserProfile.social?.[socialFieldKey] ?? '')) {
                socialDataToUpdate[socialFieldKey] = cleanData[key];
              }
            } else {
              // Handle top-level fields
              // Compare with fetchedUserProfile[key] or empty string if not present
              if (cleanData[key] !== (fetchedUserProfile[key] ?? '')) {
                profileDataToUpdate[key] = cleanData[key];
              }
            }
          }
        }
        if (Object.keys(socialDataToUpdate).length > 0) {
          // Merge with existing social data to not overwrite other social fields
          profileDataToUpdate.social = { ...(fetchedUserProfile.social || {}), ...socialDataToUpdate };
        }

        if (Object.keys(profileDataToUpdate).length > 0) {
          try {
            const profileUpdateResponse = await fetch(`/api/users/${session.user.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(profileDataToUpdate),
            });
            if (profileUpdateResponse.ok) {
              const updatedUserData = await profileUpdateResponse.json();
              // Update the session with the new user data from the server's response
              await updateSession({ user: updatedUserData.user }); // Assuming API returns { user: updatedUserObject }
              toast({ title: 'Profile Updated', description: 'Your profile was updated with the new information.' });
            } else {
              const errorData = await profileUpdateResponse.json().catch(() => ({}));
              console.error('Profile update failed:', errorData);
              toast({ title: 'Profile Update Failed', description: errorData.error || 'Could not update your profile.', variant: 'destructive' });
            }
          } catch (profileError) {
            console.error('Error updating profile:', profileError);
            toast({ title: 'Profile Update Error', description: 'An unexpected error occurred while updating your profile.', variant: 'destructive' });
          }
        }
      }
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

    const isNonEditableProfileField =
      fetchedUserProfile && // Use fetchedUserProfile here
      (field.id === 'firstName' || field.id === 'lastName' || field.id === 'email') &&
      Object.prototype.hasOwnProperty.call(fetchedUserProfile, field.id);

    switch (field.type) {
      case "text":
      case "email":
      case "password":
      case "phone":
        return (
          <Input
            type={field.type}
            placeholder={field.placeholder}
            disabled={isNonEditableProfileField}
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
            {/* Render the group label once */}
            <FormLabel>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>

            {/* Render each checkbox */}
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
                        let currentValues = Array.isArray(formField.value) ? [...formField.value] : [];

                        // --- Special logic for "Which days/dates are you available to volunteer?" ---
                        if (field.id === 'volunteerAvailability') {
                          const allEventDaysValue = "All Event Days";
                          if (checked) {
                            if (optionValue === allEventDaysValue) {
                              // If "All Event Days" is checked, it's the only selection.
                              currentValues = [allEventDaysValue];
                            } else {
                              // If an individual day is checked, add it and ensure "All Event Days" is not selected.
                              if (!currentValues.includes(optionValue)) currentValues.push(optionValue);
                              currentValues = currentValues.filter(v => v !== allEventDaysValue);
                            }
                          } else {
                            // Just remove the unchecked option.
                            currentValues = currentValues.filter((v) => v !== optionValue);
                          }
                        // --- Special logic for "Are you available for pre-event setup or post-event teardown?" ---
                        } else if (field.id === 'volunteerSetupTeardown') {
                          const bothValue = "Both";
                          const neitherValue = "Neither";
                          if (checked) {
                            if (optionValue === bothValue || optionValue === neitherValue) {
                              // If "Both" or "Neither" is checked, it's the only selection.
                              currentValues = [optionValue];
                            } else {
                              // If "Pre-event setup" or "Post-event teardown" is checked, add it and remove "Both" and "Neither".
                              if (!currentValues.includes(optionValue)) currentValues.push(optionValue);
                              currentValues = currentValues.filter(v => v !== bothValue && v !== neitherValue);
                            }
                          } else {
                            // Just remove the unchecked option.
                            currentValues = currentValues.filter((v) => v !== optionValue);
                          }
                        // --- Default logic for all other checkboxes ---
                        } else {
                          if (checked) {
                            if (!currentValues.includes(optionValue)) currentValues.push(optionValue);
                          } else {
                            currentValues = currentValues.filter((v) => v !== optionValue);
                          }
                        }
                        formField.onChange(currentValues);
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
          <Input
            type="date"
            value={formField.value ? format(new Date(formField.value), "yyyy-MM-dd") : ""}
            onChange={(e) => {
              const dateString = e.target.value;
              // When a date is cleared, dateString is empty. new Date('') is an Invalid Date.
              // So, we pass null to react-hook-form to clear the value.
              // Otherwise, parse the date string.
              const dateObject = dateString ? new Date(dateString) : null;
              formField.onChange(dateObject);
              handleBlur(field.id);
            }}
            className={error ? "border-red-500" : ""}
          />
        )
      default:
        return null
    }
  }

  if (isLoadingProfile && session?.user?.id) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your profile...</p>
      </div>
    );
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
