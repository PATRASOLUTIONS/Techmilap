import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import User, { IUser } from "@/models/User" // Import IUser if needed for speakerUsers mapping
import FormSubmission from "@/models/FormSubmission"
import { SpeakerPageContent } from "@/components/dashboard/speakers/SpeakerPageContent"

interface Socials {
    github?: string | null;
    linkedin?: string | null;
    twitter?: string | null;
    facebook?: string | null;
    instagram?: string | null;
}

interface Speaker {
    id: string;
    name: string;
    profileImage: string | null; // Use profileImage for consistency
    tagline: string | null;
    jobTitle: string | null;
    email?: string; // Optional: if needed for contact actions
    location?: string | null;
    bio?: string | null;
    skills?: string[];
    company?: string | null;
    social?: Socials;
}

export default async function AllSpeakersPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/login")
    }

    if (session.user.role !== "event-planner" && session.user.role !== "super-admin") {
        // Redirect non-planners to their appropriate dashboard or an access denied page
        redirect("/user-dashboard")
    }

    await connectToDatabase()

    const organizerId = session.user.id

    // Get all event IDs for this organizer
    const userEvents = await Event.find({ organizer: organizerId }, { _id: 1 }).lean()
    const eventIds = userEvents.map((event) => event._id)

    // Fetch all approved speaker submissions for these events
    const speakerSubmissions = await FormSubmission.find({
        eventId: { $in: eventIds },
        formType: "speaker",
        status: "approved",
    }).lean()

    const speakerUserIds = [...new Set(speakerSubmissions.map((sub) => sub.userId.toString()))]

    const speakerUsers = await User.find({
        _id: { $in: speakerUserIds },
    }).lean()

    const speakers: Speaker[] = await Promise.all(
        speakerUsers.map(async (user: IUser) => { // Explicitly type user if IUser is imported
            console.log("Speaker User:", user)
            return {
                id: user._id.toString(),
                name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.name || "Unnamed Speaker",
                profileImage: user.profileImage || null,
                tagline: user.tagline || null,
                jobTitle: user.jobTitle || null,
                email: user.email,
                location: user.location || null,
                company: user.company || null,
                social: user.social,
                bio: user.bio || null,
                skills: user.skills || [],
            };
        }),
    )

    return (
        <div className="container mx-auto py-6 space-y-6">
            <SpeakerPageContent speakers={speakers} />
        </div>
    )
}