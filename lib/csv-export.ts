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
export function formatDateForCSV(date: string | Date | undefined | null): string {
  if (!date) return ""

  try {
    const d = typeof date === "string" ? new Date(date) : date
    return d.toISOString().split("T")[0]
  } catch (e) {
    return String(date)
  }
}

/**
 * Converts an array of objects to CSV format
 */
export function objectsToCSV(
  data: any[],
  options: {
    headers?: string[]
    fields?: string[]
    includeHeaders?: boolean
    fieldFormatters?: Record<string, (value: any) => string>
  } = {},
): string {
  if (!data || data.length === 0) return ""

  const { headers, fields, includeHeaders = true, fieldFormatters = {} } = options

  // Determine fields to include
  const fieldsToInclude = fields || Object.keys(data[0])

  // Create headers row
  let csv = ""
  if (includeHeaders) {
    const headerRow = (headers || fieldsToInclude).map(escapeCSV).join(",")
    csv += headerRow + "\n"
  }

  // Add data rows
  data.forEach((item) => {
    const row = fieldsToInclude.map((field) => {
      const value = item[field]

      // Use custom formatter if provided
      if (fieldFormatters[field]) {
        return escapeCSV(fieldFormatters[field](value))
      }

      return escapeCSV(value)
    })

    csv += row.join(",") + "\n"
  })

  return csv
}

/**
 * Converts registration data to CSV format
 * @param registrations Array of registration objects
 * @returns CSV string
 */
export function registrationsToCSV(registrations: any[]): string {
  if (!registrations || registrations.length === 0) {
    return ""
  }

  // Collect all possible fields from all registrations
  const allFields = new Set<string>()
  registrations.forEach((registration) => {
    if (registration.data) {
      Object.keys(registration.data).forEach((key) => allFields.add(key))
    }
  })

  // Add standard fields
  const standardFields = ["id", "status", "createdAt", "updatedAt"]
  standardFields.forEach((field) => allFields.add(field))

  // Convert fields to array and sort
  const fields = Array.from(allFields).sort()

  // Create header row
  const header = fields.map(escapeCSVField).join(",")

  // Create data rows
  const rows = registrations.map((registration) => {
    return fields
      .map((field) => {
        let value = ""
        if (standardFields.includes(field)) {
          if (field === "id") {
            value = registration._id || ""
          } else if (field === "createdAt" || field === "updatedAt") {
            value = registration[field] ? new Date(registration[field]).toISOString() : ""
          } else {
            value = registration[field] || ""
          }
        } else if (registration.data && registration.data[field] !== undefined) {
          value = registration.data[field]
        }
        return escapeCSVField(value)
      })
      .join(",")
  })

  // Combine header and rows
  return [header, ...rows].join("\n")
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
export function downloadCSV(csvData: string, filename: string): void {
  // Create a blob with the CSV data
  const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" })

  // Create a download link
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"

  // Add to document, click, and remove
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
