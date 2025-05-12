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
    icon: "/logo-circular.png",
    apple: "/logo-circular.png",
  },
  generator: 'v0.dev',
  other: {
    'permissions-policy': 'camera=*, microphone=*'
  }
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
        <meta httpEquiv="Permissions-Policy" content="camera=*, microphone=*" />
      </head>
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
        <Toaster />
      </body>
    </html>
  )
}
