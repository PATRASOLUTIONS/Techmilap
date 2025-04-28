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
 */
export function registrationsToCSV(registrations: any[]): string {
  if (!registrations || registrations.length === 0) return ""

  // Determine all possible fields from the data
  const allFields = new Set<string>()
  const baseFields = ["name", "email", "status", "registrationDate"]

  registrations.forEach((item) => {
    if (item.data) {
      Object.keys(item.data).forEach((key) => allFields.add(key))
    }
  })

  // Create headers
  const headers = ["Name", "Email", "Status", "Registration Date", ...Array.from(allFields).map(formatFieldName)]

  // Prepare data for CSV
  const csvData = registrations.map((item) => {
    const row: Record<string, any> = {
      name: item.data?.name || item.data?.firstName || "Anonymous",
      email: item.data?.email || "N/A",
      status: item.status || "Unknown",
      registrationDate: formatDateForCSV(item.createdAt),
    }

    // Add custom fields
    if (item.data) {
      Array.from(allFields).forEach((field) => {
        row[field] = item.data[field] !== undefined ? item.data[field] : ""
      })
    }

    return row
  })

  return objectsToCSV(csvData, {
    headers,
    fields: ["name", "email", "status", "registrationDate", ...Array.from(allFields)],
  })
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
 * Triggers a download of CSV data
 */
export function downloadCSV(csvData: string, filename: string): void {
  // Create a Blob with the CSV data
  const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" })

  // Create a URL for the Blob
  const url = URL.createObjectURL(blob)

  // Create a temporary link element
  const link = document.createElement("a")
  link.href = url
  link.download = filename

  // Append to the document, click it, and remove it
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up the URL object
  URL.revokeObjectURL(url)
}
