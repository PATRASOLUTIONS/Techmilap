"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react" // Keep AlertCircle and CheckCircle
import { useToast } from "@/hooks/use-toast"


const profileFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  corporateEmail: z
    .string()
    .email({
      message: "Please enter a valid corporate email address.",
    }).optional().or(z.literal("")), // Allow empty string or valid email
  designation: z.string().max(100, "Designation can be at most 100 characters.").optional().or(z.literal("")),
  eventOrganizer: z.string().max(100, "Event organizer name can be at most 100 characters.").optional().or(z.literal("")),
  mvpId: z.string().max(50, "MVP ID can be at most 50 characters.").optional().or(z.literal("")),
  mvpProfileLink: z.string().url({ message: "Please enter a valid URL for MVP Profile." })
    .refine(val => !val || /^https?:\/\/mvp\.microsoft\.com\/[a-zA-Z-]+\/MVP\/profile\/[a-fA-F0-9-]+\/?$/.test(val), {
      message: "Please enter a valid Microsoft MVP Profile URL (e.g., https://mvp.microsoft.com/en-us/MVP/profile/your-id).",
    }).optional().or(z.literal("")),
  mvpCategory: z.string().max(100, "MVP Category can be at most 100 characters.").optional().or(z.literal("")),
  meetupEventName: z.string().max(150, "Meetup/Event name can be at most 150 characters.").optional().or(z.literal("")),
  eventDetails: z.string().max(500, "Event details can be at most 500 characters.").optional().or(z.literal("")),
  meetupPageDetails: z.string().max(200, "Meetup page details can be at most 200 characters.").optional().or(z.literal("")),
  linkedinId: z.string().url({ message: "Please enter a valid URL for LinkedIn." })
    .refine(val => !val || /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/.test(val), {
      message: "Please enter a valid LinkedIn Profile URL (e.g., https://linkedin.com/in/yourprofile).",
    }).optional().or(z.literal("")),
  githubId: z.string().url({ message: "Please enter a valid URL for GitHub." })
    .refine(val => !val || /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/.test(val), {
      message: "Please enter a valid GitHub Profile URL (e.g., https://github.com/yourusername).",
    }).optional().or(z.literal("")),
  otherSocialMediaId: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal("")),
  mobileNumber: z.string()
    .refine(val => !val || /^\+?[1-9]\d{1,14}$/.test(val), { // E.164 format-like validation
      message: "Please enter a valid mobile number (e.g., +1234567890).",
    }).optional().or(z.literal("")),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

interface ProfileFormProps {
  user: {
    _id: string
    firstName: string
    lastName: string
    email: string
    role: string
    corporateEmail?: string
    designation?: string
    eventOrganizer?: string
    mvpId?: string
    mvpProfileLink?: string
    mvpCategory?: string
    meetupEventName?: string
    eventDetails?: string
    meetupPageDetails?: string
    linkedinId?: string
    githubId?: string
    otherSocialMediaId?: string
    mobileNumber?: string
  }
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      corporateEmail: user.corporateEmail || "",
      designation: user.designation || "",
      eventOrganizer: user.eventOrganizer || "",
      mvpId: user.mvpId || "",
      mvpProfileLink: user.mvpProfileLink || "",
      mvpCategory: user.mvpCategory || "",
      meetupEventName: user.meetupEventName || "",
      eventDetails: user.eventDetails || "",
      meetupPageDetails: user.meetupPageDetails || "",
      linkedinId: user.linkedinId || "",
      githubId: user.githubId || "",
      otherSocialMediaId: user.otherSocialMediaId || "",
      mobileNumber: user.mobileNumber || "",
    },
  })

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true)
    setError("")
    setSuccess(false)

    // Custom validation is removed, react-hook-form + zod handles it.
    // If form.handleSubmit(onSubmit) is called, it means zod validation passed.

    try {

      const response = await fetch(`/api/users/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to update profile")
      }

      setSuccess(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Profile updated successfully!</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="corporateEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Corporate Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="designation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Designation</FormLabel>
              <FormControl>
                <Input type="text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="eventOrganizer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Organizer</FormLabel>
              <FormControl>
                <Input type="text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mvpId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>MVP ID</FormLabel>
              <FormControl>
                <Input type="text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mvpProfileLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel>MVP Profile Link</FormLabel>
              <FormControl>
                <Input type="text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mvpCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>MVP Category</FormLabel>
              <FormControl>
                <Input type="text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="meetupEventName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meetup Event Name</FormLabel>
              <FormControl>
                <Input type="text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="eventDetails"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Details</FormLabel>
              <FormControl>
                <Input type="text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="meetupPageDetails"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meetup Page Details</FormLabel>
              <FormControl>
                <Input type="text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="linkedinId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>LinkedIn ID</FormLabel>
              <FormControl>
                <Input type="text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="githubId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>GitHub ID</FormLabel>
              <FormControl>
                <Input type="text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="otherSocialMediaId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Other Social Media ID</FormLabel>
              <FormControl>
                <Input type="text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mobileNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number</FormLabel>
              <FormControl>
                <Input type="text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
