import type React from "react"
/**
 * Ensures an image URL is properly formatted for Next.js Image component
 *
 * @param imageUrl The original image URL
 * @returns A properly formatted image URL
 */
export function getImageUrl(imageUrl?: string): string {
  if (!imageUrl) {
    return "/vibrant-tech-event.png"
  }

  // If it's already an absolute URL or starts with a slash, return as is
  if (imageUrl.startsWith("http") || imageUrl.startsWith("/")) {
    return imageUrl
  }

  // Otherwise, assume it's a relative path and add a leading slash
  return `/${imageUrl}`
}

/**
 * Generates a placeholder image URL with the given dimensions and query
 *
 * @param width The width of the placeholder image
 * @param height The height of the placeholder image
 * @param query The query to use for the placeholder image
 * @returns A placeholder image URL
 */
export function getPlaceholderImage(width = 600, height = 400, query = "tech+event"): string {
  return `/placeholder.svg?height=${height}&width=${width}&query=${query}`
}

/**
 * Handles image loading errors by providing a fallback image
 *
 * @param event The error event
 * @param fallbackSrc Optional custom fallback image source
 */
export function handleImageError(event: React.SyntheticEvent<HTMLImageElement>, fallbackSrc?: string) {
  const target = event.currentTarget
  const defaultFallback = "/vibrant-tech-event.png"

  // Prevent infinite error loops
  if (target.src === fallbackSrc || target.src === defaultFallback) {
    return
  }

  // Set fallback image
  target.src = fallbackSrc || defaultFallback

  // Add a class to indicate fallback image is being used
  target.classList.add("image-fallback")

  // Set alt text to indicate image failed to load
  if (target.alt) {
    target.alt = `${target.alt} (failed to load)`
  } else {
    target.alt = "Image failed to load"
  }
}
