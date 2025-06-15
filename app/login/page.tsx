"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { getSession, signIn, useSession } from "next-auth/react"
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

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
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

  // debug
  console.log("Session : ", session)


  // Clean URL if there's an error parameter
  useEffect(() => {
    // Check if we have error parameters in the URL
    if (searchParams.has("error") || searchParams.has("callbackUrl")) {
      // Only clean the URL if it contains error-related parameters
      if (searchParams.get("callbackUrl")?.includes("error") || searchParams.get("error")) {
        // Replace the current URL with a clean /login path
        window.history.replaceState({}, document.title, "/login")
      }
    }
  }, [searchParams])

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

  // Redirect if already authenticated based on role
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Get the callback URL if it exists
      const callbackUrl = searchParams.get("callbackUrl")

      // If there's a specific callback URL that's not an error page, use it
      if (callbackUrl && !callbackUrl.includes("error")) {
        router.push(decodeURIComponent(callbackUrl))
        return
      }

      // Otherwise, redirect based on role
      const role = session.user.role

      if (role === "super-admin") {
        router.push("/super-admin")
      } else if (role === "event-planner") {
        router.push("/dashboard")
      } else {
        router.push("/user-dashboard")
      }
    }
  }, [session, status, router, searchParams])

  // Handle login with role-based redirection
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setShowSuccessMessage(false) // Reset success message

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
      // Get callback URL if it exists and is not an error page
      const callbackUrl = searchParams.get("callbackUrl")
      const validCallbackUrl = callbackUrl && !callbackUrl.includes("error") ? callbackUrl : null

      const result = await signIn("credentials", {
        redirect: false, // Important: never redirect automatically
        email,
        password,
      })

      // Check for authentication errors
      if (result?.error) {
        console.error("Authentication error:", result.error)

        // Display a generic error message for invalid credentials
        if (
          result.error.includes("Invalid credentials") ||
          result.error.includes("No user found") ||
          result.error.includes("Invalid password")
        ) {
          setError("Invalid credentials")
        } else {
          setError(result.error)
        }

        toast({
          variant: "destructive",
          title: "Authentication Error",
          description:
            result.error.includes("Invalid credentials") ||
            result.error.includes("No user found") ||
            result.error.includes("Invalid password")
              ? "Invalid credentials"
              : result.error,
        })

        // Clean the URL if there are error parameters
        window.history.replaceState({}, document.title, "/login")

        setIsLoading(false)
        return
      }

      // Only proceed if authentication was successful
      if (!result?.ok) {
        setError("Invalid credentials")
        setIsLoading(false)

        // Clean the URL if there are error parameters
        window.history.replaceState({}, document.title, "/login")

        return
      }

      // Show success toast
      toast({
        variant: "success",
        title: "Login Successful",
        description: "Redirecting to your dashboard...",
      })

      setShowSuccessMessage(true)

      // Fetch user data to determine role
      try {
        const userResponse = await fetch("/api/auth/me")

        if (userResponse.ok) {
          const userData = await userResponse.json()
          const userRole = userData.role || "user"

          // If there's a valid callback URL, use that
          if (validCallbackUrl) {
            window.location.href = decodeURIComponent(validCallbackUrl)
            return
          }

          // Redirect based on role
          if (userRole === "super-admin") {
            window.location.href = "/super-admin"
          } else if (userRole === "event-planner") {
            window.location.href = "/dashboard"
          } else {
            window.location.href = "/user-dashboard"
          }
        } else {
          // Fallback redirect if we can't determine the role
          console.error("Failed to fetch user data:", await userResponse.text())
          setError("Failed to fetch user data. Please try again.")
          setIsLoading(false)
          setShowSuccessMessage(false)

          // Clean the URL
          window.history.replaceState({}, document.title, "/login")
        }
      } catch (fetchError) {
        console.error("Error fetching user data:", fetchError)
        setError("An error occurred while fetching user data. Please try again.")
        setIsLoading(false)
        setShowSuccessMessage(false)

        // Clean the URL
        window.history.replaceState({}, document.title, "/login")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Invalid credentials")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid credentials",
      })
      setIsLoading(false)
      setShowSuccessMessage(false)

      // Clean the URL
      window.history.replaceState({}, document.title, "/login")
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  // If already authenticated, show loading state
  if (status === "loading" || (status === "authenticated" && session)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Image
            src="/techmilap-logo-round.png"
            alt="Tech Milap"
            width={80}
            height={80}
            className="mx-auto mb-4 animate-pulse"
          />
          <p className="text-[#170f83]">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-white via-white to-[#f8f8f8]">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <DecorativeBlob
          className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] opacity-20 blur-3xl"
          color="#fea91b"
        />
        <DecorativeBlob
          className="absolute bottom-[20%] left-[-10%] w-[40%] h-[40%] opacity-10 blur-3xl"
          color="#c12b6b"
        />
      </div>

      <div className="w-full max-w-md z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <Link href="/" className="inline-block">
            <div className="flex flex-col items-center">
              <Image src="/techmilap-logo.png" alt="Tech Milap" width={150} height={150} className="mb-2" />
              <p className="text-muted-foreground mt-2">Your complete event management solution</p>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-none shadow-xl glass-effect">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold text-[#170f83]">Welcome back</CardTitle>
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
                        <Alert className="bg-[#170f83]/10 border-[#170f83]/20 text-[#170f83] flex items-center space-x-2">
                          <Info className="h-4 w-4" />
                          <AlertDescription>Login successful! Redirecting...</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleLogin} className="space-y-4">

                    {/* email */}
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
                          className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-[#170f83]/50"
                          required
                        />
                      </div>
                    </motion.div>

                    {/* password */}
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
                          className="text-xs text-[#170f83] hover:underline focus:outline-none focus:ring-2 focus:ring-[#170f83]/50 rounded"
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
                          className="pl-10 pr-10 transition-all duration-200 focus:ring-2 focus:ring-[#170f83]/50"
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
                        className="w-full button-hover bg-gradient-to-r from-[#170f83] to-[#0aacf7]"
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
                  <motion.div className="border flex justify-center ">
                    <button onClick={() => {
                      signIn("github", { callbackUrl: "/dashboard"})

                    }}>signin with github</button>
                </motion.div>

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
                  className="text-[#170f83] hover:underline focus:outline-none focus:ring-2 focus:ring-[#170f83]/50 rounded"
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
            &copy; {new Date().getFullYear()} Tech Milap. All rights reserved.{" "}
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
