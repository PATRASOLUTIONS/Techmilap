import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import FormSubmission from "@/models/FormSubmission"
import { Types } from "mongoose"

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

export default async function VolunteersPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "event-planner" && session.user.role !== "super-admin") {
    redirect("/user-dashboard")
  }

  await connectToDatabase()

  // Find users who have volunteer form submissions approved
  const volunteerSubmissions = await FormSubmission.find({
    formType: "volunteer",
    status: "approved",
  }).distinct("userId")

  // Fetch volunteer users by IDs
  const volunteers = await User.find({
    _id: { $in: volunteerSubmissions },
  })
    .limit(20)
    .lean()

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Volunteers</h1>
      {volunteers.length > 0 ? (
        <div className="flex flex-col space-y-4">
          {volunteers.map((volunteer) => {
            const volunteerName = `${volunteer.firstName || ""} ${volunteer.lastName || ""}`.trim() || volunteer.email || "Unnamed Volunteer"
            const volunteerRole = volunteer.jobTitle || "Volunteer"
            return (
              <Card key={volunteer._id.toString()} className="overflow-hidden max-w-[600px]">
                <div className="flex items-center p-6">
                  <Avatar className="h-16 w-16 border-2 border-blue-100">
                    <AvatarImage src={volunteer.profileImage ?? undefined} alt={volunteerName} />
                    <AvatarFallback>{getInitials(volunteerName)}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 flex flex-col flex-grow">
                    <h3 className="font-semibold">{volunteerName}</h3>
                    <p className="text-sm text-muted-foreground">{volunteerRole}</p>
                    {volunteer.company && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center space-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M5 6h14M5 18h14" />
                        </svg>
                        <span>{volunteer.company}</span>
                      </p>
                    )}
                    {volunteer.bio && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{volunteer.bio}</p>
                    )}
                    <div className="flex items-center mt-2 space-x-3">
                      {volunteer.social?.twitter && (
                        <a href={volunteer.social.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm" aria-label="Twitter">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23 3a10.9 10.9 0 01-3.14.86 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                          </svg>
                        </a>
                      )}
                      {volunteer.social?.linkedin && (
                        <a href={volunteer.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm" aria-label="LinkedIn">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 3a2 2 0 110 4 2 2 0 010-4z" />
                          </svg>
                        </a>
                      )}
                      {volunteer.social?.github && (
                        <a href={volunteer.social.github} target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:underline text-sm" aria-label="GitHub">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12a10 10 0 006.84 9.54c.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.71-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.1-1.46-1.1-1.46-.9-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0112 6.84c.85 0 1.7.11 2.5.34 1.9-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.86 0 1.34-.01 2.42-.01 2.75 0 .27.18.58.69.48A10 10 0 0022 12c0-5.52-4.48-10-10-10z" />
                          </svg>
                        </a>
                      )}
                    </div>
                    {/* <div className="mt-auto">
                      <Badge className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        Volunteer
                      </Badge>
                    </div> */}
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/volunteers/${volunteer._id.toString()}`}>View Profile</Link>
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <p className="text-muted-foreground">No volunteers found.</p>
      )}
    </div>
  )
}
