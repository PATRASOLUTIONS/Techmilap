/**
 * Utility functions for CSV export
 */

/**
 * Escapes a value for CSV format
 */
export function escapeCSV(value: any): string {
  if (value === null || value === undefined) {
    return ""
  }

  const stringValue = String(value)

  // If the value contains commas, quotes, or newlines, wrap it in quotes and escape any quotes
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

/**
 * Formats a date for CSV export
 */
export function formatDateForCSV(dateString: string): string {
  if (!dateString) return ""

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString // Return original if invalid

    // Format as YYYY-MM-DD HH:MM:SS
    return date.toISOString().replace("T", " ").substring(0, 19)
  } catch (error) {
    console.error("Error formatting date for CSV:", error)
    return dateString // Return original in case of error
  }
}

/**
 * Converts an array of objects to CSV format
 */
export function objectsToCSV(
  data: Record<string, any>[],
  options: {
    includeHeaders?: boolean
    fieldFormatters?: Record<string, (value: any) => string>
  } = {},
): string {
  if (!data || data.length === 0) return ""

  const { includeHeaders = true, fieldFormatters = {} } = options

  // Get all unique keys from all objects
  const allKeys = new Set<string>()
  data.forEach((obj) => {
    Object.keys(obj).forEach((key) => allKeys.add(key))
  })

  const headers = Array.from(allKeys)

  // Process values with formatters if provided
  const processValue = (key: string, value: any): string => {
    // Apply formatter if exists for this field
    if (fieldFormatters[key] && value !== undefined && value !== null) {
      return fieldFormatters[key](value)
    }

    if (value === null || value === undefined) return ""
    if (typeof value === "object") {
      if (value instanceof Date) {
        return value.toISOString()
      }
      return JSON.stringify(value)
    }
    return String(value)
  }

  // Escape CSV values
  const escapeCSV = (value: string): string => {
    // If value contains commas, quotes, or newlines, wrap in quotes and escape any quotes
    if (/[",\n\r]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  // Create CSV rows
  const rows: string[] = []

  // Add header row if requested
  if (includeHeaders) {
    rows.push(headers.map(escapeCSV).join(","))
  }

  // Add data rows
  data.forEach((obj) => {
    const row = headers.map((key) => {
      const value = obj[key]
      return escapeCSV(processValue(key, value))
    })
    rows.push(row.join(","))
  })

  return rows.join("\n")
}

/**
 * Converts registration data to CSV format
 * @param registrations Array of registration objects
 * @returns CSV string
 */
export function registrationsToCSV(data: any[]): string {
  return objectsToCSV(data, { includeHeaders: true })
}

/**
 * Formats a field name for display
 */
export function formatFieldName(key: string): string {
  // Remove question_ prefix and _numbers suffix
  let formattedKey = key.replace(/^question_/, "").replace(/_\d+$/, "")

  // Convert camelCase or snake_case to Title Case
  formattedKey = formattedKey
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/^\w/, (c) => c.toUpperCase()) // Capitalize first letter

  return formattedKey
}

/**
 * Escapes a field for CSV format
 * @param value Field value to escape
 * @returns Escaped field value
 */
function escapeCSVField(value: any): string {
  if (value === null || value === undefined) {
    return ""
  }

  // Convert to string
  const str = String(value)

  // Check if we need to escape
  const needsEscape = str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")

  if (needsEscape) {
    // Replace double quotes with two double quotes and wrap in quotes
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

/**
 * Downloads a CSV file
 * @param csvData CSV data as string
 * @param filename Filename for the download
 */
export function downloadCSV(csvString: string, filename: string) {
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")

  // Create download link
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"

  // Trigger download
  document.body.appendChild(link)
  link.click()

  // Clean up
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
