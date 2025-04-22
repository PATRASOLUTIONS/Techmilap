import type React from "react"
import type { Metadata } from "next"
import ClientRootLayout from "./clientLayout"

export const metadata: Metadata = {
  title: "TechEventPlanner - Plan & Host Amazing Tech Events",
  description: "Your all-in-one platform for planning, managing, and hosting successful tech events of any size.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <ClientRootLayout children={children} />
}


import './globals.css'