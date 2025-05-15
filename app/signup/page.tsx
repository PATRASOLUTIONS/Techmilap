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
import { AlertCircle, Info, ArrowRight, User, Users, Mic, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { UserType } from "@/models/User"

export default function SignupPage() {
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
  const [signupSuccess, setSignupSuccess] = useState(false)

  // New state variables for event planner fields
  const [corporateEmail, setCorporateEmail] = useState("")
  const [designation, setDesignation] = useState("")
  const [eventOrganizer, setEventOrganizer] = useState("")
  const [isMicrosoftMVP, setIsMicrosoftMVP] = useState(false)
  const [mvpId, setMvpId] = useState("")
  const [mvpProfileLink, setMvpProfileLink] = useState("")
  const [mvpCategory, setMvpCategory] = useState("")
  const [isMeetupGroupRunning, setIsMeetupGroupRunning] = useState(false)
  const [meetupEventName, setMeetupEventName] = useState("")
  const [eventDetails, setEventDetails] = useState("")
  const [meetupPageDetails, setMeetupPageDetails] = useState("")
  const [linkedinId, setLinkedinId] = useState("")
  const [githubId, setGithubId] = useState("")
  const [otherSocialMediaId, setOtherSocialMediaId] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: UserType.ATTENDEE,
  })

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

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          corporateEmail: formData.userType === UserType.EVENT_PLANNER ? corporateEmail : undefined,
          designation: formData.userType === UserType.EVENT_PLANNER ? designation : undefined,
          eventOrganizer: formData.userType === UserType.EVENT_PLANNER ? eventOrganizer : undefined,
          isMicrosoftMVP: formData.userType === UserType.EVENT_PLANNER ? isMicrosoftMVP : undefined,
          mvpId: formData.userType === UserType.EVENT_PLANNER ? mvpId : undefined,
          mvpProfileLink: formData.userType === UserType.EVENT_PLANNER ? mvpProfileLink : undefined,
          mvpCategory: formData.userType === UserType.EVENT_PLANNER ? mvpCategory : undefined,
          isMeetupGroupRunning: formData.userType === UserType.EVENT_PLANNER ? isMeetupGroupRunning : undefined,
          meetupEventName: formData.userType === UserType.EVENT_PLANNER ? meetupEventName : undefined,
          eventDetails: formData.userType === UserType.EVENT_PLANNER ? eventDetails : undefined,
          meetupPageDetails: formData.userType === UserType.EVENT_PLANNER ? meetupPageDetails : undefined,
          linkedinId: formData.userType === UserType.EVENT_PLANNER ? linkedinId : undefined,
          githubId: formData.userType === UserType.EVENT_PLANNER ? githubId : undefined,
          otherSocialMediaId: formData.userType === UserType.EVENT_PLANNER ? otherSocialMediaId : undefined,
          mobileNumber: formData.userType === UserType.EVENT_PLANNER ? mobileNumber : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "An error occurred during signup")
        setIsLoading(false)
        return
      }

      // Redirect to OTP verification page with email
      router.push(`/verify-otp?email=${data.email}`)
      setSignupSuccess(true)
    } catch (err) {
      console.error("Signup error:", err)
      setError("An error occurred during signup")
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred during signup",
      })
    } finally {
      setIsLoading(false)
    }
  }

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
      console.error("Login error:", err)
      setError("An error occurred during login")
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred during login",
      })
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/50">
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
            <h1 className="text-3xl font-bold gradient-text">Tech Milap</h1>
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
              <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
              <CardDescription>Start planning your events today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="login" className="w-full">
                    Sign Up
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
                  {signupSuccess && (
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

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          type="text"
                          placeholder="John"
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          type="text"
                          placeholder="Doe"
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm password"
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Account Type</Label>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            formData.userType === UserType.ATTENDEE
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => setFormData({ ...formData, userType: UserType.ATTENDEE })}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              id="attendee-role"
                              name="userType"
                              checked={formData.userType === UserType.ATTENDEE}
                              className="h-4 w-4 text-primary"
                              onChange={() => setFormData({ ...formData, userType: UserType.ATTENDEE })}
                            />
                            <Label htmlFor="attendee-role" className="font-medium cursor-pointer">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>Attendee</span>
                              </div>
                            </Label>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">I want to discover and attend events</p>
                        </div>
                        <div
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            formData.userType === UserType.VOLUNTEER
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => setFormData({ ...formData, userType: UserType.VOLUNTEER })}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              id="volunteer-role"
                              name="userType"
                              checked={formData.userType === UserType.VOLUNTEER}
                              className="h-4 w-4 text-primary"
                              onChange={() => setFormData({ ...formData, userType: UserType.VOLUNTEER })}
                            />
                            <Label htmlFor="volunteer-role" className="font-medium cursor-pointer">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>Volunteer</span>
                              </div>
                            </Label>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">I want to help organize events</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            formData.userType === UserType.SPEAKER
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => setFormData({ ...formData, userType: UserType.SPEAKER })}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              id="speaker-role"
                              name="userType"
                              checked={formData.userType === UserType.SPEAKER}
                              className="h-4 w-4 text-primary"
                              onChange={() => setFormData({ ...formData, userType: UserType.SPEAKER })}
                            />
                            <Label htmlFor="speaker-role" className="font-medium cursor-pointer">
                              <div className="flex items-center gap-2">
                                <Mic className="h-4 w-4" />
                                <span>Speaker</span>
                              </div>
                            </Label>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">I want to speak at events</p>
                        </div>
                        <div
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            formData.userType === UserType.EVENT_PLANNER
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => setFormData({ ...formData, userType: UserType.EVENT_PLANNER })}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              id="planner-role"
                              name="userType"
                              checked={formData.userType === UserType.EVENT_PLANNER}
                              className="h-4 w-4 text-primary"
                              onChange={() => setFormData({ ...formData, userType: UserType.EVENT_PLANNER })}
                            />
                            <Label htmlFor="planner-role" className="font-medium cursor-pointer">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Event Planner</span>
                              </div>
                            </Label>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">I want to create and manage events</p>
                        </div>
                      </div>
                    </div>

                    {formData.userType === UserType.EVENT_PLANNER && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="corporateEmail">Corporate Email ID</Label>
                          <Input
                            id="corporateEmail"
                            name="corporateEmail"
                            type="email"
                            placeholder="corporate@example.com"
                            value={corporateEmail}
                            onChange={(e) => setCorporateEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="designation">Designation</Label>
                          <Input
                            id="designation"
                            name="designation"
                            type="text"
                            placeholder="Event Planner"
                            value={designation}
                            onChange={(e) => setDesignation(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="eventOrganizer">Event Organizer</Label>
                          <Input
                            id="eventOrganizer"
                            name="eventOrganizer"
                            type="text"
                            placeholder="Tech Events Inc."
                            value={eventOrganizer}
                            onChange={(e) => setEventOrganizer(e.target.value)}
                            required
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="isMicrosoftMVP"
                            checked={isMicrosoftMVP}
                            onCheckedChange={(checked) => setIsMicrosoftMVP(checked as boolean)}
                          />
                          <Label htmlFor="isMicrosoftMVP">Are you a Microsoft MVP?</Label>
                        </div>
                        {isMicrosoftMVP && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="mvpId">MVP ID</Label>
                              <Input
                                id="mvpId"
                                name="mvpId"
                                type="text"
                                placeholder="XXXXXX"
                                value={mvpId}
                                onChange={(e) => setMvpId(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mvpProfileLink">MVP Profile Link</Label>
                              <Input
                                id="mvpProfileLink"
                                name="mvpProfileLink"
                                type="text"
                                placeholder="https://mvp.microsoft.com/en-us/PublicProfile/12345"
                                value={mvpProfileLink}
                                onChange={(e) => setMvpProfileLink(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mvpCategory">MVP Category</Label>
                              <Input
                                id="mvpCategory"
                                name="mvpCategory"
                                type="text"
                                placeholder="AI"
                                value={mvpCategory}
                                onChange={(e) => setMvpCategory(e.target.value)}
                              />
                            </div>
                          </>
                        )}
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="isMeetupGroupRunning"
                            checked={isMeetupGroupRunning}
                            onCheckedChange={(checked) => setIsMeetupGroupRunning(checked as boolean)}
                          />
                          <Label htmlFor="isMeetupGroupRunning">Are you running any meetup group?</Label>
                        </div>
                        {isMeetupGroupRunning && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="meetupEventName">Meetup/Event Name</Label>
                              <Input
                                id="meetupEventName"
                                name="meetupEventName"
                                type="text"
                                placeholder="My Meetup Group"
                                value={meetupEventName}
                                onChange={(e) => setMeetupEventName(e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="eventDetails">Event Details</Label>
                              <Textarea
                                id="eventDetails"
                                name="eventDetails"
                                placeholder="Details about the event"
                                value={eventDetails}
                                onChange={(e) => setEventDetails(e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="meetupPageDetails">Meetup page details</Label>
                              <Input
                                id="meetupPageDetails"
                                name="meetupPageDetails"
                                type="text"
                                placeholder="https://www.meetup.com/myevent"
                                value={meetupPageDetails}
                                onChange={(e) => setMeetupPageDetails(e.target.value)}
                                required
                              />
                            </div>
                          </>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="linkedinId">LinkedIn ID</Label>
                          <Input
                            id="linkedinId"
                            name="linkedinId"
                            type="text"
                            placeholder="https://www.linkedin.com/in/johndoe"
                            value={linkedinId}
                            onChange={(e) => setLinkedinId(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="githubId">GitHub ID</Label>
                          <Input
                            id="githubId"
                            name="githubId"
                            type="text"
                            placeholder="https://github.com/johndoe"
                            value={githubId}
                            onChange={(e) => setGithubId(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="otherSocialMediaId">Any other social Media ID</Label>
                          <Input
                            id="otherSocialMediaId"
                            name="otherSocialMediaId"
                            type="text"
                            placeholder="https://www.example.com/johndoe"
                            value={otherSocialMediaId}
                            onChange={(e) => setOtherSocialMediaId(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mobileNumber">Mobile number</Label>
                          <Input
                            id="mobileNumber"
                            name="mobileNumber"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            required
                          />
                        </div>
                      </>
                    )}

                    <Button type="submit" className="w-full" disabled={isLoading}>
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
                          Signing up...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          Sign up <ArrowRight className="ml-2 h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Link href="/login" className="text-sm text-blue-600 hover:text-blue-800">
                Already have an account?
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
