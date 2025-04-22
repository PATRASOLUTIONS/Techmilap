"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { DecorativeBlob } from "@/components/ui/decorative-blob"
import { Eye, EyeOff, Lock, Mail, AlertCircle, Info, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { handleApiError } from "@/lib/error-handling"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [registeredSuccess, setRegisteredSuccess] = useState(false)
  const [verifiedSuccess, setVerifiedSuccess] = useState(false)

  const { toast } = useToast()

  // Check if user just registered or verified email
  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setRegisteredSuccess(true)
    }
    if (searchParams.get("verified") === "true") {
      setVerifiedSuccess(true)
    }
  }, [searchParams])

  // Clear error when inputs change
  useEffect(() => {
    if (error) setError("")
  }, [email, password])

  // Update the handleLogin function to redirect to my-events by default
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Simple validation
    if (!email) {
      setError("Please enter your email address")
      setIsLoading(false)
      return
    }

    if (!password) {
      setError("Please enter your password")
      setIsLoading(false)
      return
    }

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        // Check if it's a 500 error
        const is500Error = result.error.includes("500") || result.status === 500

        if (is500Error && typeof window !== "undefined") {
          const refreshAttempted = sessionStorage.getItem("error_refresh_attempted")

          if (!refreshAttempted) {
            sessionStorage.setItem("error_refresh_attempted", "true")
            toast({
              variant: "info",
              title: "Server Error",
              description: "Attempting to recover...",
            })

            setTimeout(() => {
              window.location.reload()
            }, 1500)

            setError("Server error encountered. Attempting to recover...")
            setIsLoading(false)
            return
          } else {
            sessionStorage.removeItem("error_refresh_attempted")
          }
        }

        setError(result.error)
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: result.error,
        })
        setIsLoading(false)
        return
      }

      // Show success toast
      toast({
        variant: "success",
        title: "Login Successful",
        description: "Redirecting to your dashboard...",
      })

      setShowSuccessMessage(true)

      // For demo purposes, redirect based on email
      if (email === "superadmin@gmail.com") {
        setTimeout(() => router.push("/super-admin"), 1000)
      } else if (email === "eventplanner@gmail.com") {
        setTimeout(() => router.push("/my-events"), 1000)
      } else {
        setTimeout(() => router.push("/my-events"), 1000)
      }
    } catch (err) {
      // Use our utility function to handle the error
      const errorMessage = handleApiError(err, (msg) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: msg,
        })
      })

      setError(errorMessage)
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/50">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <DecorativeBlob
          className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] opacity-20 blur-3xl"
          color="var(--primary)"
        />
        <DecorativeBlob
          className="absolute bottom-[20%] left-[-10%] w-[40%] h-[40%] opacity-10 blur-3xl"
          color="var(--secondary)"
        />
      </div>

      <div className="w-full max-w-md z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <Link href="/">
            <h1 className="text-3xl font-bold gradient-text">TechEventPlanner</h1>
            <p className="text-muted-foreground mt-2">Your complete event management solution</p>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-none shadow-xl glass-effect">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              <CardDescription>Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="login" className="w-full">
                    Sign In
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="login" className="space-y-4">
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Alert variant="destructive" className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    {registeredSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Alert className="bg-green-50 border-green-200 text-green-800 flex items-center space-x-2">
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Registration successful! Please check your email for verification.
                          </AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    {verifiedSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Alert className="bg-green-50 border-green-200 text-green-800 flex items-center space-x-2">
                          <Info className="h-4 w-4" />
                          <AlertDescription>Email verified successfully! You can now log in.</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    {showSuccessMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Alert className="bg-primary/10 border-primary/20 text-primary flex items-center space-x-2">
                          <Info className="h-4 w-4" />
                          <AlertDescription>Login successful! Redirecting...</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                          required
                        />
                      </div>
                    </motion.div>

                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm font-medium">
                          Password
                        </Label>
                        <Link
                          href="/forgot-password"
                          className="text-xs text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                          required
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </motion.div>

                    <motion.div
                      className="flex items-center space-x-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      />
                      <label
                        htmlFor="remember"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Remember me
                      </label>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Button
                        type="submit"
                        className="w-full button-hover bg-gradient-to-r from-primary to-secondary"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center">
                            <svg
                              className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Signing in...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            Sign in <ArrowRight className="ml-2 h-4 w-4" />
                          </span>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-0">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <motion.div
                className="text-center text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
                >
                  Sign up
                </Link>
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8 text-sm text-muted-foreground"
        >
          <p>
            &copy; {new Date().getFullYear()} TechEventPlanner. All rights reserved.{" "}
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>{" "}
            &bull;{" "}
            <Link href="/terms" className="hover:underline">
              Terms of Service
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
