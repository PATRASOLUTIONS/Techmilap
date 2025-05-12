/**
 * Utility functions for ticket handling
 */

/**
 * Extracts a name from form data using various common field patterns
 */
export function extractNameFromFormData(formData: any, submission?: any): string {
  if (!formData) return "Attendee"

  // Try standard name fields first
  const nameFields = ["name", "fullName", "attendeeName", "firstName"]
  for (const field of nameFields) {
    if (formData[field] && formData[field] !== "N/A") {
      return formData[field]
    }
  }

  // If we have firstName and lastName, combine them
  if (formData.firstName && formData.lastName) {
    return `${formData.firstName} ${formData.lastName}`
  }

  // Look for question_name_* pattern
  const questionNameField = Object.keys(formData).find(
    (key) =>
      (key.toLowerCase().startsWith("question_name_") ||
        key.toLowerCase().startsWith("question name ") ||
        key.toLowerCase().includes("_name_")) &&
      formData[key] &&
      formData[key] !== "N/A",
  )

  if (questionNameField) {
    console.log(`Found name in custom field: ${questionNameField} = ${formData[questionNameField]}`)
    return formData[questionNameField]
  }

  // If submission has a name field directly
  if (submission && submission.name && submission.name !== "N/A") {
    return submission.name
  }

  return "Attendee"
}

/**
 * Extracts an email from form data using various common field patterns
 */
export function extractEmailFromFormData(formData: any, submission?: any): string {
  if (!formData) return ""

  // Try standard email fields first
  const emailFields = ["email", "emailAddress", "attendeeEmail"]
  for (const field of emailFields) {
    if (formData[field]) {
      return formData[field]
    }
  }

  // Look for question_email_* pattern
  const questionEmailField = Object.keys(formData).find(
    (key) =>
      (key.toLowerCase().startsWith("question_email_") ||
        key.toLowerCase().startsWith("question email ") ||
        key.toLowerCase().includes("_email_")) &&
      formData[key],
  )

  if (questionEmailField) {
    console.log(`Found email in custom field: ${questionEmailField} = ${formData[questionEmailField]}`)
    return formData[questionEmailField]
  }

  // If submission has an email field directly
  if (submission && submission.email) {
    return submission.email
  }

  // Last resort: look for any field that looks like an email
  for (const key in formData) {
    const value = formData[key]
    if (typeof value === "string" && value.includes("@") && value.includes(".")) {
      console.log(`Found potential email in field: ${key} = ${value}`)
      return value
    }
  }

  return ""
}

/**
 * Generates a public ticket URL
 */
export function generateTicketUrl(ticketId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://myevent.vercel.app"
  return `${baseUrl}/tickets/${ticketId}`
}

/**
 * Formats form data for display by removing dynamic IDs from field names
 */
export function formatFormDataForDisplay(formData: any): Array<{ key: string; value: string }> {
  if (!formData) return []

  return Object.entries(formData)
    .filter(([key, value]) => {
      // Filter out common fields we already display separately
      const lowerKey = key.toLowerCase()
      return (
        !key.startsWith("question_email_") &&
        !key.startsWith("question_name_") &&
        !lowerKey.includes("email") &&
        !lowerKey.includes("name") &&
        !lowerKey.includes("password") &&
        !lowerKey.includes("token") &&
        !lowerKey.includes("csrf") &&
        typeof value === "string" &&
        value.toString().trim() !== ""
      )
    })
    .map(([key, value]) => {
      // Format the key for display
      let displayKey = key
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .replace(/^./, (str) => str.toUpperCase())
        .trim()

      // Handle question_* format
      if (displayKey.startsWith("Question ")) {
        // Extract the field name without the ID
        const parts = key.split("_")
        if (parts.length >= 2) {
          // Use the second part (the actual field name)
          displayKey = parts[1].charAt(0).toUpperCase() + parts[1].slice(1)
        }
      }

      return {
        key: displayKey,
        value: String(value),
      }
    })
}

/**
 * Formats a date string properly
 */
export function formatEventDate(dateString: string | Date): string {
  if (!dateString) return "Date not available"

  try {
    // Parse the date string
    const date = new Date(dateString)

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error("Invalid date:", dateString)
      return "Invalid date"
    }

    // Format the date
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Date format error"
  }
}
