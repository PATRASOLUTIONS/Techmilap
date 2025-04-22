/**
 * Utility function to handle API errors with automatic refresh for 500 errors
 * @param error The error object
 * @param errorCallback Function to call with error message
 * @returns The error message
 */
export function handleApiError(error: any, errorCallback?: (message: string) => void): string {
  console.error("API Error:", error)

  // Check if the error has a status code of 500
  const is500Error =
    error.status === 500 || error.statusCode === 500 || (error.message && error.message.includes("500"))

  if (is500Error && typeof window !== "undefined") {
    // Check if we've already tried refreshing for this error
    const refreshAttempted = sessionStorage.getItem("error_refresh_attempted")

    if (!refreshAttempted) {
      // Set flag to prevent infinite refresh loops
      sessionStorage.setItem("error_refresh_attempted", "true")

      // Show a message to the user
      console.log("Attempting to recover from server error...")

      // Schedule a refresh after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1500)

      return "Server error encountered. Attempting to recover..."
    } else {
      // Clear the flag so future errors can trigger a refresh
      sessionStorage.removeItem("error_refresh_attempted")
    }
  }

  // Extract error message
  const errorMessage = error.message || "An unexpected error occurred"

  // Call the error callback if provided
  if (errorCallback) {
    errorCallback(errorMessage)
  }

  return errorMessage
}

/**
 * Utility function to handle response errors and trigger refresh for 500 status
 * @param response The fetch response object
 * @returns The parsed response data if successful
 * @throws Error with appropriate message if response is not ok
 */
export async function handleResponse(response: Response) {
  if (!response.ok) {
    const status = response.status

    // For 500 errors, set up for automatic refresh
    if (status === 500 && typeof window !== "undefined") {
      const refreshAttempted = sessionStorage.getItem("error_refresh_attempted")

      if (!refreshAttempted) {
        sessionStorage.setItem("error_refresh_attempted", "true")

        // Try to get error details
        let errorText = "Server error"
        try {
          errorText = await response.text()
        } catch (e) {
          // Ignore error reading response
        }

        console.error(`Server error (${status}):`, errorText)

        // Schedule a refresh
        setTimeout(() => {
          window.location.reload()
        }, 1500)

        throw new Error("Server error encountered. Attempting to recover...")
      } else {
        sessionStorage.removeItem("error_refresh_attempted")
      }
    }

    // Handle other error cases
    let errorMessage = `Error: ${status}`

    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorData.message || errorMessage
    } catch (e) {
      try {
        // If JSON parsing fails, try to get the text
        const errorText = await response.text()
        if (errorText) errorMessage = errorText
      } catch (textError) {
        // If all fails, use the status code
        errorMessage = `Request failed with status: ${status}`
      }
    }

    throw new Error(errorMessage)
  }

  return await response.json()
}
