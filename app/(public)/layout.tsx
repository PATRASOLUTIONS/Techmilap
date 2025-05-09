import type React from "react"
import { LandingHeader } from "@/components/landing/landing-header"
import { SiteFooter } from "@/components/site-footer"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Public layout for non-authenticated routes
  return (
    <>
      <LandingHeader />
      <main className="min-h-screen">{children}</main>
      <SiteFooter />
    </>
  )
}
