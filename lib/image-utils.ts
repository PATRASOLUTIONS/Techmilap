/**
 * Ensures an image URL is properly formatted for Next.js Image component
 *
 * @param imageUrl The original image URL
 * @returns A properly formatted image URL
 */
export function getImageUrl(imageUrl?: string): string {
  if (!imageUrl) {
    return "/placeholder.svg?height=400&width=600&query=tech+event"
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
