import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "@/components/providers/session-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Tech Milap - Plan & Host Amazing Tech Events",
  description: "Your all-in-one platform for planning, managing, and hosting successful tech events of any size.",
  icons: {
    icon: "/techmilap-logo-round.png",
    apple: "/techmilap-logo-round.png",
  },
  generator: "v0.dev",
  other: {
    "permissions-policy": "camera=(self), microphone=(self)",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Permissions-Policy" content="camera=(self), microphone=(self)" />
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src * 'self' data: blob:; script-src * 'self' 'unsafe-inline' 'unsafe-eval'; style-src * 'self' 'unsafe-inline'; img-src * 'self' data: blob:; media-src * 'self' data: blob:; connect-src * 'self'; font-src * 'self'; object-src 'none'; frame-src * 'self'; worker-src * 'self' blob:; frame-ancestors 'self'; form-action 'self'; base-uri 'self'; manifest-src 'self'"
        />
      </head>
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
        <Toaster />
      </body>
    </html>
  )
}
