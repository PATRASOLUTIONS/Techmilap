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
import { AlertCircle, CheckCircle } from "lucide-react"

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
    })
    .optional(),
  designation: z.string().optional(),
  eventOrganizer: z.string().optional(),
  mvpId: z.string().optional(),
  mvpProfileLink: z.string().optional(),
  mvpCategory: z.string().optional(),
  meetupEventName: z.string().optional(),
  eventDetails: z.string().optional(),
  meetupPageDetails: z.string().optional(),
  linkedinId: z.string().optional(),
  githubId: z.string().optional(),
  otherSocialMediaId: z.string().optional(),
  mobileNumber: z.string().optional(),
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
