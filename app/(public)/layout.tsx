import type React from "react"
import { SiteFooter } from "@/components/site-footer"
import { LandingHeader } from "@/components/landing/landing-header"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
