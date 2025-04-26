import type React from "react"
export default function EventsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This layout will be used for all routes under /events
  // We're removing any header or footer references
  return <>{children}</>
}
