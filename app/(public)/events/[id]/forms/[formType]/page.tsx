"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

interface FormData {
  questions: {
    id: string
    type: string
    label?: string
  }[]
}

interface EventFormPageProps {
  params: {
    id: string
    formType: string
  }
}

// Update the handleSubmit function in the form page component
const handleSubmit = async (
  data: any,
  setSubmitting: (value: boolean) => void,
  formData: FormData | null,
  formType: string,
  id: string,
  setSuccess: (value: boolean) => void,
  router: any,
  toast: any,
) => {
  try {
    setSubmitting(true)
    console.log("Submitting form data:", data)

    // Add a debug email field if none exists
    // This is a fallback to ensure there's always an email field
    let hasEmail = false
    const emailFields = ["email", "corporateEmail", "userEmail", "emailAddress", "mail"]

    // Check if any of the standard email fields exist
    for (const field of emailFields) {
      if (data[field] && typeof data[field] === "string" && data[field].includes("@")) {
        hasEmail = true
        console.log(`Found email in field ${field}: ${data[field]}`)
        break
      }
    }

    // If no standard email field, look for any field that might contain an email
    if (!hasEmail) {
      // Look for any field that contains an @ symbol
      for (const key in data) {
        if (data[key] && typeof data[key] === "string" && data[key].includes("@") && data[key].includes(".")) {
          // Found a field that looks like an email
          console.log(`Found potential email in field ${key}: ${data[key]}`)
          data.email = data[key] // Add it as a standard email field
          hasEmail = true
          break
        }
      }
    }

    // If still no email, look for a field with "email" in its name
    if (!hasEmail) {
      for (const key in data) {
        if (key.toLowerCase().includes("email") || key.toLowerCase().includes("mail")) {
          console.log(`Found field with email in name: ${key} with value: ${data[key]}`)
          // If this field doesn't have a value, try to find another field to use as email
          if (!data[key] || data[key] === "") {
            continue
          }
          data.email = data[key]
          hasEmail = true
          break
        }
      }
    }

    // Last resort: check form questions for an email field
    if (!hasEmail && formData && formData.questions) {
      const emailQuestion = formData.questions.find(
        (q) =>
          q.type === "email" ||
          q.id.toLowerCase().includes("email") ||
          (q.label && q.label.toLowerCase().includes("email")),
      )

      if (emailQuestion) {
        console.log(`Found email question with id: ${emailQuestion.id}`)
        // If we found an email question but the value isn't in data, add a placeholder
        if (!data[emailQuestion.id] || data[emailQuestion.id] === "") {
          console.log("Email field exists but no value provided")
          throw new Error("Please provide a valid email address in the " + (emailQuestion.label || "email") + " field.")
        }
      }
    }

    // Add a debug email as absolute last resort
    if (!hasEmail) {
      console.log("No email field found in form data, adding debug email")
      // Use a field that looks like it might be a name + a placeholder domain
      let possibleName = ""
      for (const key in data) {
        if (key.toLowerCase().includes("name") && data[key] && typeof data[key] === "string" && data[key].length > 0) {
          possibleName = data[key].replace(/\s+/g, ".").toLowerCase()
          break
        }
      }

      if (possibleName) {
        data.email = `${possibleName}@example.com`
        console.log(`Created placeholder email: ${data.email}`)
      } else {
        data.email = `attendee.${Date.now()}@example.com`
        console.log(`Created random placeholder email: ${data.email}`)
      }
    }

    // Determine the endpoint based on form type
    let endpoint = ""
    if (formType === "register" || formType === "attendee") {
      endpoint = `/api/events/${id}/submissions/attendee`
    } else if (formType === "volunteer") {
      endpoint = `/api/events/${id}/submissions/volunteer`
    } else if (formType === "speaker") {
      endpoint = `/api/events/${id}/submissions/speaker`
    } else {
      throw new Error("Unknown form type")
    }

    console.log(`Submitting to endpoint: ${endpoint}`)

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ formData: data }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error response:", errorData)

      // Check if this is a validation error with details
      if (errorData.error === "Validation error" && errorData.details) {
        console.error("Validation error details:", errorData.details)
        const errorMessage = errorData.message || "Please check your form inputs and try again."
        throw new Error(`Validation error: ${errorMessage}`)
      }

      throw new Error(errorData.error || errorData.message || "Failed to submit form")
    }

    const result = await response.json()
    console.log("Submission result:", result)

    setSuccess(true)
    toast({
      title: "Success!",
      description: result.message || "Your form has been submitted successfully.",
    })

    // Redirect after successful submission
    setTimeout(() => {
      router.push(`/events/${id}?submission=success&type=${formType}`)
    }, 2000)
  } catch (error: any) {
    console.error("Form submission error:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to submit form. Please try again.",
      variant: "destructive",
    })
  } finally {
    setSubmitting(false)
  }
}

export default function EventFormPage({ params }: EventFormPageProps) {
  const { id, formType } = params
  const [isSubmitting, setSubmitting] = useState(false)
  const [isSuccess, setSuccess] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const [formData, setFormData] = useState<FormData | null>(null)

  // Example usage of the handleSubmit function
  const handleFormSubmit = async (data: any) => {
    await handleSubmit(data, setSubmitting, formData, formType, id, setSuccess, router, toast)
  }

  return <>{/* Your form component JSX here */}</>
}
