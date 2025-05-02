import type React from "react"
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Public layout for non-authenticated routes
  return <>{children}</>
}
