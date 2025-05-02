import type React from "react"
export default function EventsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Events-specific layout
  return <>{children}</>
}
