import { ObjectId } from "mongodb"

/**
 * Validates and cleans a ticket ID for processing
 */
export function validateTicketId(rawId: string): {
  isValid: boolean
  cleanedId: string
  originalId: string
  error?: string
  knownPrefix?: string
} {
  // Store the original ID for reference
  const originalId = rawId

  // Check if the ID is empty or just whitespace
  if (!rawId || !rawId.trim()) {
    return {
      isValid: false,
      cleanedId: "",
      originalId,
      error: "Ticket ID cannot be empty",
    }
  }

  // Trim whitespace
  let cleanedId = rawId.trim()
  let knownPrefix: string | undefined

  // Check for and remove known prefixes
  const knownPrefixes = ["#", "ID:", "TICKET:", "TKT:", "T-", "E-"]
  for (const prefix of knownPrefixes) {
    if (cleanedId.toUpperCase().startsWith(prefix)) {
      cleanedId = cleanedId.substring(prefix.length)
      knownPrefix = prefix
      break
    }
  }

  // Check if the ID is a valid ObjectId
  const isValidObjectId = ObjectId.isValid(cleanedId)

  // Check if the ID is a valid email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isValidEmail = emailRegex.test(cleanedId)

  // If it's neither a valid ObjectId nor an email, and it's too short, it might be invalid
  if (!isValidObjectId && !isValidEmail && cleanedId.length < 3) {
    return {
      isValid: false,
      cleanedId,
      originalId,
      knownPrefix,
      error: "Ticket ID is too short or in an invalid format",
    }
  }

  return {
    isValid: true,
    cleanedId,
    originalId,
    knownPrefix,
  }
}

/**
 * Creates a list of search variations for a ticket ID
 */
export function createSearchVariations(ticketId: string): string[] {
  const variations: string[] = [ticketId]

  // Add a variation with no special characters
  const noSpecialChars = ticketId.replace(/[^a-zA-Z0-9]/g, "")
  if (noSpecialChars !== ticketId) {
    variations.push(noSpecialChars)
  }

  // Add lowercase variation
  const lowercase = ticketId.toLowerCase()
  if (lowercase !== ticketId) {
    variations.push(lowercase)
  }

  // Add uppercase variation
  const uppercase = ticketId.toUpperCase()
  if (uppercase !== ticketId) {
    variations.push(uppercase)
  }

  return variations
}

/**
 * Formats a ticket ID for display
 */
export function formatTicketId(id: string, prefix?: string): string {
  if (!prefix) {
    // Default formatting with # prefix if no specific prefix
    return `#${id}`
  }
  return `${prefix}${id}`
}
