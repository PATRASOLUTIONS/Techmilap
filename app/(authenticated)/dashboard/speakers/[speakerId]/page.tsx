import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import FavoriteSpeakerButton from "@/components/dashboard/FavoriteSpeakerButton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ArrowLeft, CalendarDays, MapPin, Star, Mail, Linkedin, Building2 } from "lucide-react"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import User, { IUser } from "@/models/User"
import Review, { IReview } from "@/models/Review"
import FormSubmission, { IFormSubmission } from "@/models/FormSubmission"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Types } from "mongoose"
import { format } from "date-fns"
import DynamicEmailModal from "@/components/dashboard/DynamicEmailModal"

// Helper function to get initials from name
const getInitials = (name: string = "") => {
  if (!name || typeof name !== 'string') return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase();
};

interface SpeakerDetailsPageProps {
  params: {
    speakerId: string
  }
}

export default async function SpeakerDetailsPage({ params }: SpeakerDetailsPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "event-planner" && session.user.role !== "super-admin") {
    redirect("/user-dashboard")
  }

  if (!Types.ObjectId.isValid(params.speakerId)) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid Speaker ID</AlertTitle>
          <AlertDescription>The speaker ID provided is not valid.</AlertDescription>
        </Alert>
      </div>
    )
  }

  await connectToDatabase()

  const speaker = await User.findById(params.speakerId).lean() as IUser | null

  if (!speaker) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Speaker Not Found</AlertTitle>
          <AlertDescription>No speaker found with the provided ID.</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Fetch current user to get favoriteSpeakers
  const currentUser = await User.findById(session.user.id).lean() as IUser | null
  const isFavorite = currentUser?.favoriteSpeakers?.includes(params.speakerId) ?? false

  const organizerId = session.user.id

  // Get all event IDs for this organizer
  const organizerEvents = await Event.find({ organizer: organizerId }, { _id: 1 }).lean()
  const organizerEventIds = organizerEvents.map((event) => event._id)

  // Find events this speaker is approved for, limited to the organizer's events
  const speakerEventSubmissions = await FormSubmission.find({
    userId: speaker._id,
    eventId: { $in: organizerEventIds },
    formType: "speaker",
    status: "approved",
  })
    .populate<{ eventId: { _id: Types.ObjectId; title: string; date: Date; slug: string } }>({
      path: 'eventId',
      select: 'title date slug', // Select fields you need from the Event model
      model: Event // Explicitly provide the model for population
    })
    .lean() as (Omit<IFormSubmission, 'eventId'> & { eventId: { _id: Types.ObjectId; title: string; date: Date; slug: string } })[]


  // Find reviews for this speaker, limited to the organizer's events
  const speakerReviews = await Review.find({
    targetType: "speaker",
    targetId: speaker._id,
    eventId: { $in: organizerEventIds },
  })
    .populate<{ userId: { firstName: string; lastName: string; name: string } }>({
      path: 'userId',
      select: 'firstName lastName name',
      model: User
    })
    .sort({ createdAt: -1 })
    .lean() as (Omit<IReview, 'userId'> & { userId: { firstName?: string; lastName?: string; name?: string } })[]

  const speakerName = `${speaker.firstName || ""} ${speaker.lastName || ""}`.trim() || speaker.name || "Unnamed Speaker"
  const speakerRole = speaker.jobTitle || "Speaker"

  // Example expertise and topics (replace with real data if available)
  const areaOfExpertise = speaker.areasOfExpertise || ["Information & Communications Technology", "Law & Regulation"];
  const topics = speaker.skills || ["Ceph", "Infrastructure", "Software defined storage", "Solid State Storage", "Storage", "vegan"];

  return (
    <div className="container mx-auto py-6">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/speakers">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Speakers
        </Link>
      </Button>

      <Card className="mt-6 p-6 flex flex-col md:flex-row gap-8 items-start">
        {/* Left: Avatar, Socials, Actions */}
        <div className="flex flex-col items-center w-full md:w-1/3 max-w-xs mx-auto">
          <Avatar className="h-40 w-40 border-4 border-white shadow-lg mb-4">
            <AvatarImage src={speaker.profileImage ?? undefined} alt={speakerName} />
            <AvatarFallback className="text-4xl">{getInitials(speakerName)}</AvatarFallback>
          </Avatar>
          {/* Social/Profile Links */}
          <div className="flex flex-row gap-3 mb-4 w-full items-center justify-center">
            {speaker.social?.linkedin && (
              <a href={speaker.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-[#0a66c2] hover:opacity-80">
                <Linkedin className="h-6 w-6" />
              </a>
            )}
            {speaker.social?.github && (
              <a href={speaker.social.github} target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:opacity-80">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.157-1.11-1.465-1.11-1.465-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.987 1.029-2.686-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.699 1.028 1.593 1.028 2.686 0 3.847-2.337 4.695-4.566 4.944.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .267.18.577.688.479C19.138 20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2z" /></svg>
              </a>
            )}
            {speaker.social?.twitter && (
              <a href={speaker.social.twitter} target="_blank" rel="noopener noreferrer" className="text-[#1da1f2] hover:opacity-80">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22.46 5.924c-.793.352-1.645.59-2.54.698a4.48 4.48 0 0 0 1.963-2.475 8.94 8.94 0 0 1-2.828 1.082A4.48 4.48 0 0 0 16.11 4c-2.48 0-4.49 2.014-4.49 4.5 0 .353.04.697.116 1.025C7.728 9.37 4.1 7.6 1.67 4.905c-.386.664-.607 1.437-.607 2.26 0 1.56.793 2.936 2.003 3.744-.736-.023-1.428-.226-2.034-.563v.057c0 2.18 1.548 4.002 3.6 4.418-.377.104-.775.16-1.186.16-.29 0-.568-.028-.84-.08.57 1.77 2.22 3.06 4.18 3.09A8.98 8.98 0 0 1 2 19.54a12.67 12.67 0 0 0 6.88 2.02c8.26 0 12.78-6.84 12.78-12.77 0-.195-.004-.39-.013-.583A9.22 9.22 0 0 0 24 4.59a8.94 8.94 0 0 1-2.54.697z" /></svg>
              </a>
            )}
            {speaker.social?.facebook && (
              <a href={speaker.social.facebook} target="_blank" rel="noopener noreferrer" className="text-[#1877f3] hover:opacity-80">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.325 24h11.495v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.408 24 22.674V1.326C24 .592 23.406 0 22.675 0" /></svg>
              </a>
            )}
            {speaker.social?.instagram && (
              <a href={speaker.social.instagram} target="_blank" rel="noopener noreferrer" className="text-[#e1306c] hover:opacity-80">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.974.974 1.246 2.242 1.308 3.608.058 1.266.069 1.646.069 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.974.974-2.242 1.246-3.608 1.308-1.266.058-1.646.069-4.85.069s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.974-.974-1.246-2.242-1.308-3.608C2.175 15.647 2.163 15.267 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608.974-.974 2.242-1.246 3.608-1.308C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.332.013 7.052.072 5.771.131 4.659.363 3.678 1.344c-.98.98-1.213 2.092-1.272 3.374C2.013 8.332 2 8.741 2 12c0 3.259.013 3.668.072 4.948.059 1.282.292 2.394 1.272 3.374.98.98 2.092 1.213 3.374 1.272C8.332 23.987 8.741 24 12 24s3.668-.013 4.948-.072c1.282-.059 2.394-.292 3.374-1.272.98-.98 1.213-2.092 1.272-3.374.059-1.28.072-1.689.072-4.948 0-3.259-.013-3.668-.072-4.948-.059-1.282-.292-2.394-1.272-3.374-.98-.98-2.092-1.213-3.374-1.272C15.668.013 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998zm6.406-11.845a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" /></svg>
              </a>
            )}
          </div>
          {speaker.company && (
            <span className="flex items-center gap-2 text-muted-foreground mb-4">
              <Building2 className="h-5 w-5" /> {speaker.company}
            </span>
          )}
          {/* Favorite and Contact Buttons */}
          <div className="flex gap-2 w-full justify-center mb-4">
            <FavoriteSpeakerButton speakerId={params.speakerId} initialIsFavorite={isFavorite} />
            {speaker.email && (
              <DynamicEmailModal email={speaker.email} name={speakerName} type="speaker"/>
            )}
          </div>
        </div>

        {/* Right: Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-2 mb-2">
            <span className="uppercase text-xs font-semibold text-muted-foreground tracking-widest">Speaker</span>
            <h1 className="text-3xl font-bold leading-tight">{speakerName}</h1>
            <div className="text-lg text-muted-foreground font-medium">{speakerRole}</div>
            {speaker.location && (
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <MapPin className="mr-2 h-4 w-4" />
                {speaker.location}
              </div>
            )}
          </div>
          {speaker.bio && (
            <div className="mb-4 text-base text-muted-foreground">
              {speaker.bio}
            </div>
          )}
          {/* Area of Expertise */}
          <div className="mb-4">
            <div className="font-semibold text-sm mb-1 text-muted-foreground">AREA OF EXPERTISE</div>
            <div className="flex flex-wrap gap-2">
              {areaOfExpertise.map((exp, i) => (
                <Badge key={i} variant="outline" className="bg-muted text-foreground font-normal px-3 py-1 rounded-full">
                  {exp}
                </Badge>
              ))}
            </div>
          </div>
          {/* Topics */}
          <div className="mb-4">
            <div className="font-semibold text-sm mb-1 text-muted-foreground">TOPICS</div>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic, i) => (
                <Badge key={i} variant="secondary" className="bg-muted text-foreground font-normal px-3 py-1 rounded-full">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Events and Reviews below */}
      <div className="grid md:grid-cols-2 gap-8 mt-8">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold mb-3">Events Speaking At (Your Events)</h3>
          </CardHeader>
          <CardContent>
            {speakerEventSubmissions.length > 0 ? (
              <div className="space-y-3">
                {speakerEventSubmissions.map((submission) => (
                  submission.eventId && (
                    <Link key={submission._id.toString()} href={`/events/${submission.eventId.slug}`} target="_blank" rel="noopener noreferrer" className="block hover:bg-accent p-3 border rounded-md transition-colors">
                      <p className="font-medium">{submission.eventId.title}</p>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {format(new Date(submission.eventId.date), "PPP")}
                      </p>
                    </Link>
                  )
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">This speaker is not currently scheduled for any of your upcoming approved events.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold mb-3">Reviews (From Your Events)</h3>
          </CardHeader>
          <CardContent>
            {speakerReviews.length > 0 ? (
              <div className="space-y-4">
                {speakerReviews.map((review) => (
                  <div key={review._id.toString()} className="p-4 border rounded-md">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-5 w-5 ${i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{format(new Date(review.createdAt), "PP")}</p>
                    </div>
                    <p className="text-sm font-medium mb-1">{review.title}</p>
                    <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                    <p className="text-xs text-muted-foreground">
                      By: {`${review.userId?.firstName || ""} ${review.userId?.lastName || ""}`.trim() || review.userId?.name || "Anonymous"}
                    </p>
                    {review.reply && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs font-semibold text-primary">Organizer Reply:</p>
                        <p className="text-xs text-muted-foreground">{review.reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No reviews found for this speaker from your events.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
