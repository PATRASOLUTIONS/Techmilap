import type React from "react"
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Remove any header or footer for all public routes
  return <>{children}</>
}
