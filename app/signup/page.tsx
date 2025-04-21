"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user", // Default role
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Signup form, 2: Verification form
  const [verificationCode, setVerificationCode] = useState("")
  const [verificationError, setVerificationError] = useState("")
  const [verificationSuccess, setVerificationSuccess] = useState(false)
  const [resendDisabled, setResendDisabled] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when user types
    if (error) setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError("All fields are required")
      setIsLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      // Map the role value to match what the API expects
      const roleMapping = {
        user: "user",
        "event-planner": "event-planner",
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: roleMapping[formData.role as keyof typeof roleMapping],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      // Show toast notification
      toast({
        variant: "info",
        title: "Check your email",
        description: "We've sent a verification code to your email address.",
      })

      // Move to verification step
      setStep(2)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setVerificationError("")

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          code: verificationCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Verification failed")
      }

      setVerificationSuccess(true)
      setTimeout(() => {
        router.push("/login?verified=true")
      }, 2000)
    } catch (err: any) {
      setVerificationError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setResendDisabled(true)
    setCountdown(60)

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend verification code")
      }

      // Start countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            setResendDisabled(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err: any) {
      setVerificationError(err.message)
      setResendDisabled(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-background to-muted/50">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{step === 1 ? "Sign up" : "Verify your email"}</CardTitle>
          <CardDescription>
            {step === 1
              ? "Create an account to start planning your events"
              : "Enter the verification code sent to your email"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 ? (
            // Step 1: Signup Form
            <>
              {error && (
                <Alert variant="destructive" className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="m@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        formData.role === "user"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setFormData((prev) => ({ ...prev, role: "user" }))}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="user-role"
                          name="role"
                          checked={formData.role === "user"}
                          onChange={() => setFormData((prev) => ({ ...prev, role: "user" }))}
                          className="h-4 w-4 text-primary"
                        />
                        <Label htmlFor="user-role" className="font-medium cursor-pointer">
                          Attendee
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">I want to discover and attend events</p>
                    </div>
                    <div
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        formData.role === "event-planner"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setFormData((prev) => ({ ...prev, role: "event-planner" }))}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="planner-role"
                          name="role"
                          checked={formData.role === "event-planner"}
                          onChange={() => setFormData((prev) => ({ ...prev, role: "event-planner" }))}
                          className="h-4 w-4 text-primary"
                        />
                        <Label htmlFor="planner-role" className="font-medium cursor-pointer">
                          Event Planner
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">I want to create and manage events</p>
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing up..." : "Sign up"}
                </Button>
              </form>
            </>
          ) : (
            // Step 2: Verification Form
            <>
              {verificationError && (
                <Alert variant="destructive" className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{verificationError}</AlertDescription>
                </Alert>
              )}

              {verificationSuccess && (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>Email verified successfully! Redirecting to login page...</AlertDescription>
                </Alert>
              )}

              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  We've sent a verification code to <span className="font-medium">{formData.email}</span>
                </p>
              </div>

              <form onSubmit={handleVerification} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Verification Code</Label>
                  <Input
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || verificationSuccess}>
                  {isLoading ? "Verifying..." : "Verify Email"}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleResendCode}
                    disabled={resendDisabled || verificationSuccess}
                    className="text-sm"
                  >
                    {resendDisabled ? `Resend code in ${countdown} seconds` : "Didn't receive a code? Resend"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
