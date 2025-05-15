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
        key.toLowerCase().includes("_name_") ||
        key.toLowerCase().includes(" name ")) &&
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

  // If submission has userName field
  if (submission && submission.userName && submission.userName !== "N/A") {
    return submission.userName
  }

  // Look for any field that might contain a name
  for (const key in formData) {
    if (
      (key.toLowerCase().includes("name") || key.toLowerCase().includes("full")) &&
      typeof formData[key] === "string" &&
      formData[key].trim() !== "" &&
      formData[key] !== "N/A"
    ) {
      return formData[key]
    }
  }

  return "Attendee"
}

/**
 * Extracts an email from form data using various common field patterns
 */
export function extractEmailFromFormData(formData: any, submission?: any): string {
  if (!formData) return ""

  // Try standard email fields first
  const emailFields = ["email", "emailAddress", "attendeeEmail", "userEmail"]
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
        key.toLowerCase().includes("_email_") ||
        key.toLowerCase().includes(" email ")) &&
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

  // If submission has userEmail field
  if (submission && submission.userEmail) {
    return submission.userEmail
  }

  // Last resort: look for any field that looks like an email
  for (const key in formData) {
    const value = formData[key]
    if (typeof value === "string" && value.includes("@") && value.includes(".")) {
      console.log(`Found potential email in field: ${key} = ${value}`)
      return value
    }
  }

  // If we have a user object in the submission
  if (submission && submission.user && submission.user.email) {
    return submission.user.email
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

/**
 * Generates a short ticket ID (6 characters)
 * This can be used for user-friendly ticket references
 */
export function generateShortTicketId(): string {
  // Generate a random 6-character alphanumeric string
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""

  // Get current timestamp and use it as part of the ID to reduce collision chance
  const timestamp = Date.now().toString(36).slice(-4)

  // Add 2 random characters
  for (let i = 0; i < 2; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  // Combine for a 6-character ID
  return (timestamp + result).slice(0, 6)
}

/**
 * Formats a ticket ID with proper formatting (adding # prefix)
 * @param ticketId The raw ticket ID to format
 * @returns Formatted ticket ID
 */
export function formatTicketId(ticketId: string): string {
  // If the ticket ID already starts with #, return it as is
  if (ticketId.startsWith("#")) {
    return ticketId
  }

  // Otherwise, add the # prefix
  return `#${ticketId}`
}
