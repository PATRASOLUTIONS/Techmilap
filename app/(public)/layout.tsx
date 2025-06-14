import type React from "react"
import { LandingHeader } from "@/components/landing/landing-header"
import { SiteFooter } from "@/components/site-footer"
import Navbar from "@/components/landing/NavBar"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Public layout for non-authenticated routes
  return (
    <>
      {/* <LandingHeader /> */}
      <Navbar />
      
      <main className="min-h-screen pt-6">{children}</main>
      <SiteFooter />
    </>
  )
}
