"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { AlertCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  const router = useRouter()
  const { status } = useSession()
  const [countdown, setCountdown] = useState(3)

  // Determine redirect path based on authentication status
  const redirectPath = status === "authenticated" ? "/my-events" : "/"

  useEffect(() => {
    // Set up countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Redirect when countdown reaches 0
          router.push(redirectPath)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Clean up timer on unmount
    return () => clearInterval(timer)
  }, [router, redirectPath])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex flex-col items-center">
          <div className="bg-red-100 p-3 rounded-full">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="mt-6 text-4xl font-extrabold text-gray-900">404</h1>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">Page Not Found</h2>
          <p className="mt-2 text-base text-gray-600">Sorry, we couldn't find the page you're looking for.</p>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <p className="text-sm text-gray-600">
            Redirecting you to {status === "authenticated" ? "your events" : "home"} in{" "}
            <span className="font-bold text-red-600">{countdown}</span> seconds...
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
            <div
              className="bg-red-600 h-2.5 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
          <Link
            href={redirectPath}
            className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            Go now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-5 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Contact support
          </Link>
        </div>
      </div>
    </div>
  )
}
