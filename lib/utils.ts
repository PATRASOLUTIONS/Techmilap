import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  if (!date) return "Date not available"

  try {
    let dateObj: Date

    if (typeof date === "string") {
      // Try to parse ISO string
      dateObj = parseISO(date)
    } else {
      dateObj = date
    }

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn("Invalid date:", date)
      return "Invalid date"
    }

    return dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch (error) {
    console.error("Error formatting date:", error, date)
    return "Date error"
  }
}

export function formatTime(time: string): string {
  if (!time) return ""

  try {
    // Handle different time formats

    // If it's just a time string like "14:30"
    if (time.length <= 5 && time.includes(":")) {
      const [hours, minutes] = time.split(":").map(Number)
      const period = hours >= 12 ? "PM" : "AM"
      const hour12 = hours % 12 || 12
      return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`
    }

    // If it's a full datetime string
    const date = new Date(time)
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    }

    // Fallback to original
    return time
  } catch (e) {
    console.error("Error formatting time:", e, time)
    return time // Return original if parsing fails
  }
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim()
}

export function getEventUrl(event: { _id: string; slug?: string }): string {
  if (!event) return "#"
  return `/events/${event.slug || event._id}`
}

// Add a new function to normalize slugs for comparison
export function normalizeSlug(slug: string): string {
  if (!slug) return ""
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^\w-]/g, "") // Remove any non-alphanumeric characters except hyphens
}

// Add a new function to format event date and time together
export function formatEventDateTime(date: string | Date, startTime?: string, endTime?: string): string {
  let result = formatDate(date)

  if (startTime) {
    result += ` at ${formatTime(startTime)}`

    if (endTime) {
      result += ` - ${formatTime(endTime)}`
    }
  }

  return result
}
