import type React from "react"
export default function RegisterFormLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This is a minimal layout with no header or footer
  return <div className="min-h-screen">{children}</div>
}
