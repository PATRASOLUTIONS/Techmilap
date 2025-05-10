/**
 * Utility functions for ticket handling
 */

/**
 * Extracts a name from form data using various common field patterns
 */
export function extractNameFromFormData(formData: any): string {
  if (!formData) return "N/A"

  // First try direct name fields
  if (formData.name) return formData.name
  if (formData.fullName) return formData.fullName
  if (formData.firstName) {
    const lastName = formData.lastName || ""
    return `${formData.firstName} ${lastName}`.trim()
  }

  // Then try fields that start with question_name_
  const nameKeys = Object.keys(formData).filter((key) => key.startsWith("question_name_"))

  if (nameKeys.length > 0) {
    return formData[nameKeys[0]]
  }

  return "N/A"
}

/**
 * Extracts an email from form data using various common field patterns
 */
export function extractEmailFromFormData(formData: any): string {
  if (!formData) return "N/A"

  // First try direct email fields
  if (formData.email) return formData.email
  if (formData.emailAddress) return formData.emailAddress

  // Then try fields that start with question_email_
  const emailKeys = Object.keys(formData).filter((key) => key.startsWith("question_email_"))

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
