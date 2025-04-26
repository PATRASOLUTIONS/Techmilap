import type React from "react"
export default function EventsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This layout will be used for all routes under /events
  // For the forms pages, it will be overridden by the forms layout
  return <>{children}</>
}
