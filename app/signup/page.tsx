"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
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
import { GithubSigninButton } from "@/components/Button/OauthSigninButton"

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [registeredSuccess, setRegisteredSuccess] = useState(false)
  const [verifiedSuccess, setVerifiedSuccess] = useState(false)
  const { toast } = useToast()
  const [signupSuccess, setSignupSuccess] = useState(false)

  // Event planner fields
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

  // Form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "attendee", // Default to attendee
  })

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
  }, [formData])

  const handleMobileNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Allow digits, +, (, ), -, and space.
    // You can adjust this regex to be more or less restrictive.
    const sanitizedValue = inputValue.replace(/[^0-9+()-\s]/g, "");
    setMobileNumber(sanitizedValue);
  };

  const validateForm = () => {
    // Basic Info Validation
    if (!formData.firstName.trim()) {
      setError("First name is required.");
      return false;
    }
    if (!formData.lastName.trim()) {
      setError("Last name is required.");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Invalid email format.");
      return false;
    }
    if (!formData.password) {
      setError("Password is required.");
      return false;
    }
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!passwordPattern.test(formData.password)) {
      setError("Password must be at least 8 characters and include uppercase, lowercase, number, and special character.");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    // Event Planner Specific Validation
    if (formData.userType === "event-planner") {
      if (!corporateEmail.trim()) {
        setError("Corporate email is required for event planners.");
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(corporateEmail)) {
        setError("Invalid corporate email format.");
        return false;
      }
      if (!designation.trim()) {
        setError("Designation is required for event planners.");
        return false;
      }
      if (!eventOrganizer.trim()) {
        setError("Event organizer name is required for event planners.");
        return false;
      }
      if (isMicrosoftMVP) {
        if (!mvpId.trim()) { setError("MVP ID is required if you are an MVP."); return false; }
        if (!mvpProfileLink.trim()) { setError("MVP Profile Link is required if you are an MVP."); return false; }
        if (!/^https?:\/\/.+/.test(mvpProfileLink)) { setError("Invalid MVP Profile Link URL format (e.g., https://mvp.microsoft.com/...)."); return false; }
        if (!mvpCategory.trim()) { setError("MVP Category is required if you are an MVP."); return false; }
      }
      if (isMeetupGroupRunning) {
        if (!meetupEventName.trim()) { setError("Meetup/Event Name is required if you run a meetup."); return false; }
        if (!eventDetails.trim()) { setError("Event Details are required if you run a meetup."); return false; }
        if (!meetupPageDetails.trim()) { setError("Meetup Page Details are required if you run a meetup."); return false; }
        if (!/^https?:\/\/.+/.test(meetupPageDetails)) { setError("Invalid Meetup Page Details URL format (e.g., https://meetup.com/...)."); return false; }
      }
      if (!linkedinId.trim()) {
        setError("LinkedIn ID is required for event planners.");
        return false;
      }
      const linkedinPattern = /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]{1,100}\/?$/;
      if (!linkedinPattern.test(linkedinId)) { setError("Invalid LinkedIn URL. Expected format: https://www.linkedin.com/in/username"); return false; }

      if (!githubId.trim()) {
        setError("GitHub ID is required for event planners.");
        return false;
      }
      const githubPattern = /^https:\/\/(www\.)?github\.com\/[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}\/?$/;
      if (!githubPattern.test(githubId)) { setError("Invalid GitHub URL. Expected format: https://github.com/username"); return false; }

      if (!mobileNumber.trim()) {
        setError("Mobile number is required for event planners.");
        return false;
      }
      const mobilePattern = /^\+?[0-9\s()-]{7,20}$/;
      if (!mobilePattern.test(mobileNumber)) { setError("Invalid mobile number. Must be 7-20 digits and can include +, (), -, space."); return false; }
    }
    return true; // Form is valid
  };


  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!validateForm()) {
      setIsLoading(false)
      return
    }

    try {
      // Determine role based on userType
      const role = formData.userType === "event-planner" ? "event-planner" : "user"

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: role,
        userType: formData.userType,
      }

      // Add event planner fields if applicable
      if (formData.userType === "event-planner") {
        Object.assign(payload, {
          corporateEmail,
          designation,
          eventOrganizer,
          isMicrosoftMVP,
          mvpId,
          mvpProfileLink,
          mvpCategory,
          isMeetupGroupRunning,
          meetupEventName,
          eventDetails,
          meetupPageDetails,
          linkedinId,
          githubId,
          otherSocialMediaId,
          mobileNumber,
        })
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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
              <Tabs defaultValue="signup" className="w-full">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="signup" className="w-full">
                    Sign Up
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="signup" className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {registeredSuccess && (
                    <Alert className="bg-green-50 border-green-200 text-green-800 flex items-center space-x-2">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Registration successful! Please check your email for verification.
                      </AlertDescription>
                    </Alert>
                  )}

                  {signupSuccess && (
                    <Alert className="bg-green-50 border-green-200 text-green-800 flex items-center space-x-2">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Registration successful! Please check your email for verification.
                      </AlertDescription>
                    </Alert>
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
                        minLength={8}
                        maxLength={16}
                        pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$"
                        title="Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
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
                        minLength={8}
                        maxLength={64}
                        pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$"
                        title="Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Account Type</Label>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${formData.userType === "attendee"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                            }`}
                          onClick={() => setFormData({ ...formData, userType: "attendee" })}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              id="attendee-role"
                              name="userType"
                              checked={formData.userType === "attendee"}
                              className="h-4 w-4 text-primary"
                              onChange={() => setFormData({ ...formData, userType: "attendee" })}
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
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${formData.userType === "volunteer"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                            }`}
                          onClick={() => setFormData({ ...formData, userType: "volunteer" })}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              id="volunteer-role"
                              name="userType"
                              checked={formData.userType === "volunteer"}
                              className="h-4 w-4 text-primary"
                              onChange={() => setFormData({ ...formData, userType: "volunteer" })}
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
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${formData.userType === "speaker"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                            }`}
                          onClick={() => setFormData({ ...formData, userType: "speaker" })}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              id="speaker-role"
                              name="userType"
                              checked={formData.userType === "speaker"}
                              className="h-4 w-4 text-primary"
                              onChange={() => setFormData({ ...formData, userType: "speaker" })}
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
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${formData.userType === "event-planner"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                            }`}
                          onClick={() => setFormData({ ...formData, userType: "event-planner" })}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              id="planner-role"
                              name="userType"
                              checked={formData.userType === "event-planner"}
                              className="h-4 w-4 text-primary"
                              onChange={() => setFormData({ ...formData, userType: "event-planner" })}
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

                    {formData.userType === "event-planner" && (
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
                            onCheckedChange={(checked) => setIsMicrosoftMVP(checked === true)}
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
                            onCheckedChange={(checked) => setIsMeetupGroupRunning(checked === true)}
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
                            pattern="^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]{3,100}\/?$"
                            title="Format: https://www.linkedin.com/in/your-username. Username must be 3-100 characters using only letters (a-z, A-Z), numbers (0-9), and hyphens (-)."
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
                            pattern="^https:\/\/(www\.)?github\.com\/[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}\/?$"
                            minLength={20} // e.g., https://github.com/a
                            title="Enter a valid GitHub profile URL (e.g., https://github.com/yourusername). Username must be 1-39 characters."
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
                            onChange={handleMobileNumberChange}
                            required
                            pattern="^\+?[0-9\s()-]{7,20}$"
                            title="Please enter a valid phone number, e.g., +1 (555) 123-4567"
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

                  {/* Oauth Signin Button */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className=" flex justify-center ">
                      <GithubSigninButton/>
                  </motion.div>

                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-center ">
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
