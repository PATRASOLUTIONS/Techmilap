/**
 * Utility functions for ticket handling
 */

/**
 * Extracts a name from form data using various common field patterns
 */
export function extractNameFromFormData(formData: any): string {
  if (!formData) return "N/A"

  // Try common field names for name
  const possibleNameFields = [
    "name",
    "fullName",
    "full_name",
    "firstName",
    "first_name",
    "attendeeName",
    "attendee_name",
    "displayName",
    "display_name",
    "question_name",
    "Name",
    "FullName",
    "FirstName",
  ]

  for (const field of possibleNameFields) {
    if (formData[field] && typeof formData[field] === "string") {
      return formData[field]
    }
  }

  // If still not found, look for any field containing "name"
  for (const key in formData) {
    if (key.toLowerCase().includes("name") && typeof formData[key] === "string" && formData[key].length > 0) {
      return formData[key]
    }
  }

  return "N/A"
}

/**
 * Extracts an email from form data using various common field patterns
 */
export function extractEmailFromFormData(formData: any): string {
  if (!formData) return "N/A"

  // Try common field names for email
  const possibleEmailFields = [
    "email",
    "emailAddress",
    "email_address",
    "userEmail",
    "user_email",
    "attendeeEmail",
    "attendee_email",
    "Email",
    "EmailAddress",
  ]

  for (const field of possibleEmailFields) {
    if (formData[field] && typeof formData[field] === "string") {
      return formData[field]
    }
  }

  // If still not found, look for any field containing "email"
  for (const key in formData) {
    if (
      (key.toLowerCase().includes("email") || key.toLowerCase().includes("mail")) &&
      typeof formData[key] === "string" &&
      formData[key].includes("@")
    ) {
      return formData[key]
    }
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
