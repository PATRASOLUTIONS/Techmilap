/**
 * Utility functions for ticket handling
 */

/**
 * Extracts a name from form data using various common field patterns
 */
export function extractNameFromFormData(formData: any, submission?: any): string {
  // First try the userName field if available in the submission
  if (submission?.userName && submission.userName !== "N/A") {
    return submission.userName
  }

  if (!formData) return "N/A"

  // Try common name fields
  const nameFields = ["name", "fullName", "full_name", "firstName", "first_name", "attendeeName", "attendee_name"]
  for (const field of nameFields) {
    if (formData[field]) {
      return formData[field]
    }
  }

  // Try to combine first and last name
  if (formData.firstName && formData.lastName) {
    return `${formData.firstName} ${formData.lastName}`
  }
  if (formData.first_name && formData.last_name) {
    return `${formData.first_name} ${formData.last_name}`
  }

  // Try fields that start with question_name_ or contain "name"
  const nameKeys = Object.keys(formData).filter(
    (key) => key.toLowerCase().includes("name") || key.startsWith("question_name_"),
  )

  if (nameKeys.length > 0) {
    return formData[nameKeys[0]]
  }

  return "N/A"
}

/**
 * Extracts an email from form data using various common field patterns
 */
export function extractEmailFromFormData(formData: any, submission?: any): string {
  // First try the userEmail field if available in the submission
  if (submission?.userEmail && submission.userEmail !== "N/A") {
    return submission.userEmail
  }

  if (!formData) return "N/A"

  // Try common email fields
  const emailFields = ["email", "emailAddress", "email_address", "attendeeEmail", "attendee_email"]
  for (const field of emailFields) {
    if (formData[field]) {
      return formData[field]
    }
  }

  // Try fields that start with question_email_ or contain "email"
  const emailKeys = Object.keys(formData).filter(
    (key) => key.toLowerCase().includes("email") || key.startsWith("question_email_"),
  )

  if (emailKeys.length > 0) {
    return formData[emailKeys[0]]
  }

  return "N/A"
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
