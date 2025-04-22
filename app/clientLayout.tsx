"use client"

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "@/components/providers/session-provider"
import { Toaster } from "@/components/ui/toaster"
import { useEffect } from "react"

function ErrorBoundary({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      console.error("Client error caught:", event.error)
      // You could report this to an error tracking service
    }

    window.addEventListener("error", handler)

    return () => {
      window.removeEventListener("error", handler)
    }
  }, [])

  return <>{children}</>
}

const inter = Inter({ subsets: ["latin"] })

export default function ClientRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  )
}
