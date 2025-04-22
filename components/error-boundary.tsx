"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { ServerErrorRefresh } from "@/components/ui/server-error-refresh"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  is500Error: boolean
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      is500Error: false,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's a 500 error
    const is500Error =
      error.message.includes("500") ||
      error.message.includes("server error") ||
      error.message.includes("internal server error")

    return {
      hasError: true,
      error,
      is500Error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.state.is500Error) {
        return <ServerErrorRefresh message={this.state.error?.message} />
      }

      // For non-500 errors, use the provided fallback or a default error message
      return (
        this.props.fallback || (
          <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-800">
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <p className="text-sm">{this.state.error?.message || "An unexpected error occurred"}</p>
          </div>
        )
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
