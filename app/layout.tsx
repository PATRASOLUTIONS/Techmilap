import type React from "react"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { SessionProvider } from "@/components/providers/session-provider"
import ErrorBoundary from "@/components/error-boundary"

export const metadata = {
  title: "MyEvent - Event Planning Made Easy",
  description: "Plan, manage, and attend events with ease",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  )
}
