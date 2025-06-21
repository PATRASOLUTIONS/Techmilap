"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import MultiValueInput from "@/components/ui/MultiValueInput"

const profileFormSchema = z.object({
  // Personal Tab
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  mobileNumber: z.string()
    .refine(val => !val || /^\+?[1-9]\d{1,14}$/.test(val), { message: "Please enter a valid mobile number (e.g., +1234567890)." })
    .optional().or(z.literal("")),
  profileImage: z.string().url({ message: "Please enter a valid URL for your profile image." }).optional().or(z.literal("")),
  bio: z.string().max(500, "Bio can be at most 500 characters.").optional().or(z.literal("")),

  // Professional Tab
  company: z.string().max(100, "Company name can be at most 100 characters.").optional().or(z.literal("")),
  jobTitle: z.string().max(100, "Job title can be at most 100 characters.").optional().or(z.literal("")),
  designation: z.string().max(100, "Designation can be at most 100 characters.").optional().or(z.literal("")),
  corporateEmail: z.string().email({ message: "Please enter a valid corporate email address." }).optional().or(z.literal("")),

  // Online Presence Tab
  website: z.string().url({ message: "Please enter a valid personal website URL." }).optional().or(z.literal("")),
  social: z.object({
    twitter: z.string().url({ message: "Please enter a valid Twitter/X URL." }).optional().or(z.literal("")),
    linkedin: z.string().url({ message: "Please enter a valid LinkedIn URL." }).optional().or(z.literal("")),
    github: z.string().url({ message: "Please enter a valid GitHub URL." }).optional().or(z.literal("")),
    facebook: z.string().url({ message: "Please enter a valid Facebook URL." }).optional().or(z.literal("")),
    instagram: z.string().url({ message: "Please enter a valid Instagram URL." }).optional().or(z.literal("")),
  }).optional().default({ twitter: "", linkedin: "", github: "", facebook: "", instagram: "" }),
  otherSocialMediaId: z.string().url({ message: "Please enter a valid URL for other social media." }).optional().or(z.literal("")), // Kept for generic links

  // Speaker Profile Tab (Conditional)
  tagline: z.string().max(150, "Tagline can be at most 150 characters.").optional().or(z.literal("")),
  location: z.string().max(100, "Location can be at most 100 characters.").optional().or(z.literal("")),
  skills: z.array(z.string().min(1, "Skill cannot be empty.").max(50, "Skill can be at most 50 characters.")).optional().default([]),
  areasOfExpertise: z.array(z.string().min(1, "Area of expertise cannot be empty.").max(100, "Area of expertise can be at most 100 characters.")).optional().default([]),
  blogUrl: z.string().url({ message: "Please enter a valid blog URL." }).optional().or(z.literal("")),
  companyWebsite: z.string().url({ message: "Please enter a valid company website URL." }).optional().or(z.literal("")),

  // Community Tab
  eventOrganizer: z.string().max(100, "Event organizer name can be at most 100 characters.").optional().or(z.literal("")),
  mvpId: z.string().max(50, "MVP ID can be at most 50 characters.").optional().or(z.literal("")),
  mvpProfileLink: z.string().url({ message: "Please enter a valid URL for MVP Profile." })
    .refine(val => !val || /^https?:\/\/mvp\.microsoft\.com\/[a-zA-Z-]+\/MVP\/profile\/[a-fA-F0-9-]+\/?$/.test(val), {
      message: "Please enter a valid Microsoft MVP Profile URL.",
    }).optional().or(z.literal("")),
  mvpCategory: z.string().max(100, "MVP Category can be at most 100 characters.").optional().or(z.literal("")),
  meetupEventName: z.string().max(150, "Meetup/Event name can be at most 150 characters.").optional().or(z.literal("")),
  eventDetails: z.string().max(500, "Event details can be at most 500 characters.").optional().or(z.literal("")),
  meetupPageDetails: z.string().url({ message: "Please enter a valid URL for the meetup page."}).optional().or(z.literal("")), // Changed to URL
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string; // Keep role if needed for other logic, though userType is primary for profile fields
    userType: string; // Crucial for conditional rendering

    // Personal
    mobileNumber?: string;
    profileImage?: string;
    bio?: string;

    // Professional
    company?: string;
    jobTitle?: string;
    designation?: string;
    corporateEmail?: string;

    // Online Presence
    website?: string;
    social?: {
      twitter?: string;
      linkedin?: string;
      github?: string;
      facebook?: string;
      instagram?: string;
    };
    otherSocialMediaId?: string; // Kept for generic links
    linkedinId?: string; // From old schema, prefer social.linkedin
    githubId?: string;   // From old schema, prefer social.github

    // Speaker Profile
    tagline?: string;
    location?: string;
    skills?: string[];
    areasOfExpertise?: string[];
    blogUrl?: string;
    companyWebsite?: string;

    // Community
    eventOrganizer?: string;
    mvpId?: string;
    mvpProfileLink?: string;
    mvpCategory?: string;
    meetupEventName?: string;
    eventDetails?: string;
    meetupPageDetails?: string;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      mobileNumber: user.mobileNumber || "",
      profileImage: user.profileImage || "",
      bio: user.bio || "",

      company: user.company || "",
      jobTitle: user.jobTitle || "",
      designation: user.designation || "",
      corporateEmail: user.corporateEmail || "",

      website: user.website || "",
      social: {
        twitter: user.social?.twitter || "",
        linkedin: user.social?.linkedin || user.linkedinId || "", // Prioritize social, fallback to old linkedinId
        github: user.social?.github || user.githubId || "",     // Prioritize social, fallback to old githubId
        facebook: user.social?.facebook || "",
        instagram: user.social?.instagram || "",
      },
      otherSocialMediaId: user.otherSocialMediaId || "",

      tagline: user.tagline || "",
      location: user.location || "",
      skills: user.skills || [],
      areasOfExpertise: user.areasOfExpertise || [],
      blogUrl: user.blogUrl || "",
      companyWebsite: user.companyWebsite || "",

      eventOrganizer: user.eventOrganizer || "",
      mvpId: user.mvpId || "",
      mvpProfileLink: user.mvpProfileLink || "",
      mvpCategory: user.mvpCategory || "",
      meetupEventName: user.meetupEventName || "",
      eventDetails: user.eventDetails || "",
      meetupPageDetails: user.meetupPageDetails || "",
    },
  });

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);
    setError("");
    setSuccess(false);

    // Data is already in the correct format due to Zod and react-hook-form
    // For array fields like 'skills' and 'areasOfExpertise',
    // if they were simple textareas with comma-separated values,
    // you'd split them here. But the current setup handles them as arrays.

    try {
      const response = await fetch(`/api/users/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to update profile");
      }

      setSuccess(true);
      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });
      router.refresh(); // Refresh server components to reflect changes
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Update Failed",
        description: err.message || "Could not update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Helper for array fields with Textarea
  const handleArrayInputChange = (
    field: any, // react-hook-form field object
    value: string,
    separator: string = ","
  ) => {
    // Split by comma or whitespace (space, tab, etc.)
    const arrayValue = value.split(/[,\s]+/).map(item => item.trim()).filter(item => item);
    field.onChange(arrayValue);
  };

  const getArrayInputString = (
    fieldValue: string[] | undefined,
    separator: string = ", "
  ): string => {
    return Array.isArray(fieldValue) ? fieldValue.join(separator) : "";
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {error && !success && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Profile updated successfully!</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-6">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="professional">Professional</TabsTrigger>
            <TabsTrigger value="online-presence">Online Presence</TabsTrigger> {/* Corrected: Facebook and Instagram were in Speaker, moved to Online Presence or Speaker as appropriate */}
            {user.userType === "speaker" && (
              <TabsTrigger value="speaker-profile">Speaker Profile</TabsTrigger>
            )}
            <TabsTrigger value="community">Community</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField name="firstName" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>First Name</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              <FormField name="lastName" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Last Name</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            </div>
            <FormField name="email" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Email</FormLabel> <FormControl><Input type="email" {...field} disabled /></FormControl> <FormMessage /> <p className="text-xs text-muted-foreground pt-1">Email cannot be changed.</p> </FormItem> )} />
            <FormField name="mobileNumber" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Mobile Number</FormLabel> <FormControl><Input type="tel" {...field} placeholder="+1234567890" /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField name="profileImage" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Profile Image URL</FormLabel> <FormControl><Input type="url" {...field} placeholder="https://example.com/image.png" /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField name="bio" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Bio / About Me</FormLabel> <FormControl><Textarea {...field} rows={4} placeholder="Tell us a little about yourself..." /></FormControl> <FormMessage /> </FormItem> )} />
          </TabsContent>

          {/* Professional Details Tab */}
          <TabsContent value="professional" className="space-y-6">
            <FormField name="company" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Company</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField name="jobTitle" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Job Title</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField name="designation" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Designation</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField name="corporateEmail" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Corporate Email</FormLabel> <FormControl><Input type="email" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          </TabsContent>

          {/* Online Presence Tab */}
          <TabsContent value="online-presence" className="space-y-6">
            <FormField name="website" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Personal Website</FormLabel> <FormControl><Input type="url" {...field} placeholder="https://yourwebsite.com" /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField name="social.twitter" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Twitter/X Profile URL</FormLabel> <FormControl><Input type="url" {...field} placeholder="https://x.com/username" /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField name="social.linkedin" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>LinkedIn Profile URL</FormLabel> <FormControl><Input type="url" {...field} placeholder="https://linkedin.com/in/username" /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField name="social.github" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>GitHub Profile URL</FormLabel> <FormControl><Input type="url" {...field} placeholder="https://github.com/username" /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField name="social.facebook" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Facebook Profile URL</FormLabel> <FormControl><Input type="url" {...field} placeholder="https://facebook.com/username" /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField name="social.instagram" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Instagram Profile URL</FormLabel> <FormControl><Input type="url" {...field} placeholder="https://instagram.com/username" /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField name="otherSocialMediaId" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Other Social Media URL</FormLabel> <FormControl><Input type="url" {...field} placeholder="https://othersocial.com/username" /></FormControl> <FormMessage /> </FormItem> )} />
          </TabsContent>

          {/* Speaker Profile Tab - Conditional */}
          {user.userType === "speaker" && (
            <TabsContent value="speaker-profile" className="space-y-6">
              <FormField name="tagline" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Tagline</FormLabel> <FormControl><Input {...field} placeholder="e.g., Passionate about technology and community" /></FormControl> <FormMessage /> </FormItem> )} />
              <FormField name="location" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Location</FormLabel> <FormControl><Input {...field} placeholder="e.g., San Francisco, CA or Remote" /></FormControl> <FormMessage /> </FormItem> )} />
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => {
                  const skillCount = Array.isArray(field.value) ? field.value.length : 0;
                  return (
                    <FormItem>
                      <FormLabel>Skills</FormLabel>
                      <FormControl>
                        <MultiValueInput
                          placeholder="Enter skills"
                          values={field.value || []}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      {skillCount > 1 && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Adding multiple skills ({skillCount} total)
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="areasOfExpertise"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Areas of Expertise</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter areas of expertise, separated by commas (e.g., Cloud Architecture, AI Ethics)"
                        value={getArrayInputString(field.value)}
                        onChange={(e) => handleArrayInputChange(field, e.target.value)}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField name="blogUrl" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Blog URL</FormLabel> <FormControl><Input type="url" {...field} placeholder="https://myblog.com" /></FormControl> <FormMessage /> </FormItem> )} />
              <FormField name="companyWebsite" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Company Website URL (if different from personal)</FormLabel> <FormControl><Input type="url" {...field} placeholder="https://company.com" /></FormControl> <FormMessage /> </FormItem> )} />
            </TabsContent>
          )}

          {/* Community Engagement Tab */}
          <TabsContent value="community" className="space-y-6">
            <FormField name="eventOrganizer" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Event Organizer Name (if any)</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField name="mvpId" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Microsoft MVP ID</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField name="mvpProfileLink" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>MVP Profile Link</FormLabel> <FormControl><Input type="url" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField name="mvpCategory" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>MVP Category</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField name="meetupEventName" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Meetup/Event Name (if you run one)</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField name="eventDetails" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Event Details</FormLabel> <FormControl><Textarea {...field} rows={3} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField name="meetupPageDetails" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Meetup Page URL</FormLabel> <FormControl><Input type="url" {...field} placeholder="https://meetup.com/your-group" /></FormControl> <FormMessage /> </FormItem> )} />
          </TabsContent>
        </Tabs>

        <div className="flex items-center gap-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
