import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  if (!date) return "Date not available"

  const d = typeof date === "string" ? new Date(date) : date

  // Check if date is valid
  if (isNaN(d.getTime())) return "Invalid date"

  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatTime(time: string): string {
  if (!time) return ""

  try {
    // Handle 24-hour format (convert to 12-hour)
    const [hours, minutes] = time.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const hour12 = hours % 12 || 12
    return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`
  } catch (e) {
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
