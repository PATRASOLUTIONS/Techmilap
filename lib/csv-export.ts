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
 * Converts an array of objects to CSV format
 */
export function exportToCSV(data: any[], filename: string): void {
  if (!data || data.length === 0) {
    console.warn("No data to export")
    return
  }

  const csvRows = []

  // Get the headers
  const headers = Object.keys(data[0])
  csvRows.push(headers.map((header) => `"${header.replace(/"/g, '""')}"`).join(","))

  // Get the values
  for (const item of data) {
    const values = headers.map((header) => {
      const value = item[header]
      if (value === null || value === undefined) {
        return ""
      }
      const strValue = String(value)
      if (strValue.includes(",") || strValue.includes('"') || strValue.includes("\n")) {
        return `"${strValue.replace(/"/g, '""')}"`
      }
      return strValue
    })
    csvRows.push(values.join(","))
  }

  // Combine rows
  const csvString = csvRows.join("\n")

  // Create a download link
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
