"use client"

import { useState, useEffect } from "react"

interface TicketQRCodeProps {
  qrCodeUrl: string
  ticketId: string
  size?: number
  className?: string
}

export function TicketQRCode({ qrCodeUrl, ticketId, size = 120, className = "" }: TicketQRCodeProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 2

  // Reset states when URL changes
  useEffect(() => {
    setIsImageLoaded(false)
    setHasError(false)
    setRetryCount(0)
  }, [qrCodeUrl])

  // Handle image load success
  const handleImageLoad = () => {
    setIsImageLoaded(true)
    setHasError(false)
  }

  // Handle image load error
  const handleImageError = () => {
    if (retryCount < maxRetries) {
      // Retry loading with a delay
      setTimeout(() => {
        setRetryCount((prev) => prev + 1)
      }, 1000)
    } else {
      setHasError(true)
    }
  }

  return (
    <div
      className={`bg-white rounded-md shadow-sm w-${size / 4} h-${size / 4} flex items-center justify-center relative ${className}`}
    >
      {/* Show loading state */}
      {!isImageLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Show error state */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 p-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-gray-400 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-xs text-center text-gray-500">
            QR Code
            <br />
            Unavailable
          </p>
        </div>
      )}

      {/* Regular img tag as primary method */}
      <img
        src={qrCodeUrl || "/placeholder.svg"}
        alt="Ticket QR Code"
        width={size}
        height={size}
        className={`w-full h-full object-contain ${isImageLoaded ? "block" : "hidden"}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />

      {/* Fallback for direct URL access */}
      {retryCount > 0 && !isImageLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <a
            href={qrCodeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 underline text-center p-2"
          >
            View QR Code
          </a>
        </div>
      )}
    </div>
  )
}
