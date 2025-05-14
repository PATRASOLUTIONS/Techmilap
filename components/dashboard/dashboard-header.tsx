"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { Bell, User } from "lucide-react"
import { useEffect, useState } from "react"

export function DashboardHeader() {
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    console.log("Dashboard header mounted, session:", session?.user)
  }, [session])

  if (!mounted) {
    return null
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 md:px-8">
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/" className="hidden md:block">
            <span className="text-xl font-bold">MyEvent</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-red-500"></span>
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800">
              <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-medium">{session?.user?.name || "User"}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{session?.user?.role || "user"}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
