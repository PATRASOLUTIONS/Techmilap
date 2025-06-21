import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, MapPin, Mail, Star } from "lucide-react"
import { connectToDatabase } from "@/lib/mongodb"
import User, { IUser } from "@/models/User"
import FormSubmission, { IFormSubmission } from "@/models/FormSubmission"
import Review from "@/models/Review"
import { Types } from "mongoose"
import { format } from "date-fns"
import DynamicEmailModal from "@/components/dashboard/DynamicEmailModal"

// Helper function to get initials from name
const getInitials = (name: string = "") => {
  if (!name || typeof name !== 'string') return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
}

interface VolunteerDetailsPageProps {
  params: {
    id: string
  }
}

export default async function VolunteerDetailsPage({ params }: VolunteerDetailsPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "event-planner" && session.user.role !== "super-admin") {
    redirect("/user-dashboard")
  }

  if (!Types.ObjectId.isValid(params.id)) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid Volunteer ID</AlertTitle>
          <AlertDescription>The volunteer ID provided is not valid.</AlertDescription>
        </Alert>
      </div>
    )
  }

  await connectToDatabase()

  const volunteer = await User.findById(params.id).lean() as IUser | null

  if (!volunteer) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Volunteer Not Found</AlertTitle>
          <AlertDescription>No volunteer found with the provided ID.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const volunteerName = `${volunteer.firstName || ""} ${volunteer.lastName || ""}`.trim() || volunteer.email || "Unnamed Volunteer"
  const volunteerRole = volunteer.jobTitle || "Volunteer"

  // Fetch volunteer's approved event submissions
  const volunteerEventSubmissions = await FormSubmission.find({
    userId: volunteer._id,
    formType: "volunteer",
    status: "approved",
  })
    .populate({
      path: 'eventId',
      select: 'title date slug',
    })
    .lean() as unknown as (Omit<IFormSubmission, 'eventId'> & { eventId: { _id: Types.ObjectId; title: string; date: Date; slug: string } })[]

  return (
    <div className="container mx-auto py-6">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/volunteers">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Volunteers
        </Link>
      </Button>

      <Card className="mt-6 p-6 flex flex-col md:flex-row gap-8 items-start">
        <div className="flex flex-col items-center w-full md:w-1/3 max-w-xs mx-auto">
          <Avatar className="h-40 w-40 border-4 border-white shadow-lg mb-4">
            <AvatarImage src={volunteer.profileImage ?? undefined} alt={volunteerName} />
            <AvatarFallback className="text-4xl">{getInitials(volunteerName)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-row gap-3 mb-4 w-full items-center justify-center">
            <DynamicEmailModal email={volunteer.email} name={volunteerName} type="volunteer"/>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-2 mb-2">
            <span className="uppercase text-xs font-semibold text-muted-foreground tracking-widest">Volunteer</span>
            <h1 className="text-3xl font-bold leading-tight">{volunteerName}</h1>
            <div className="text-lg text-muted-foreground font-medium">{volunteerRole}</div>
            {volunteer.location && (
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <MapPin className="mr-2 h-4 w-4" />
                {volunteer.location}
              </div>
            )}
          </div>
          {volunteer.bio && (
            <div className="mb-4 text-base text-muted-foreground">
              {volunteer.bio}
            </div>
          )}
        </div>
      </Card>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Events Volunteering At</h3>
        {volunteerEventSubmissions.length > 0 ? (
          <ul className="space-y-3">
            {volunteerEventSubmissions.map((submission) => (
              submission.eventId && (
                <li key={submission._id.toString()}>
                  <Link href={`/events/${submission.eventId.slug}`} target="_blank" rel="noopener noreferrer" className="block hover:bg-accent p-3 border rounded-md transition-colors">
                    <p className="font-medium">{submission.eventId.title}</p>
                    <p className="text-sm text-muted-foreground">{format(new Date(submission.eventId.date), "PPP")}</p>
                  </Link>
                </li>
              )
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">This volunteer is not currently scheduled for any of your upcoming approved events.</p>
        )}
      </div>
    </div>
  )
}
