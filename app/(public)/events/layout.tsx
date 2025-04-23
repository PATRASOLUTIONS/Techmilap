import type React from "react"
import { LandingHeader } from "@/components/landing/landing-header"

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LandingHeader />
      <main className="min-h-screen">{children}</main>
    </>
  )
}
