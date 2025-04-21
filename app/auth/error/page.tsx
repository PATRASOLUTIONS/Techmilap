"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function AuthErrorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  // Redirect to login after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/login?error=" + encodeURIComponent(error || "Unknown authentication error"))
    }, 3000)

    return () => clearTimeout(timer)
  }, [error, router])

  const getErrorMessage = () => {
    switch (error) {
      case "CredentialsSignin":
        return "Invalid email or password. Please try again."
      case "EmailNotVerified":
        return "Please verify your email before logging in."
      default:
        return "An authentication error occurred. Please try again."
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/50">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4 text-destructive">
            <AlertCircle className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Authentication Error</CardTitle>
          <CardDescription className="text-center">{getErrorMessage()}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">Redirecting you to the login page...</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/login">Return to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
