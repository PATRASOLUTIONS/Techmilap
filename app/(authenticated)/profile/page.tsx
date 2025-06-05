import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProfileForm } from "@/components/profile/profile-form"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  await connectToDatabase()

  const user = await User.findById(session.user.id).select("-password").lean()

  if (!user) {
    return <div>User not found</div>
  }

  const plainUserObject = {
    ...user,
    _id: user._id.toString(), // Convert ObjectId to string
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
    updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : undefined,
    // Explicitly convert contents of arrays that might contain ObjectIds or nested Mongoose documents.
    createdEvents: user.createdEvents ? user.createdEvents.map((eventId: any) => eventId.toString()) : [],
    registeredEvents: user.registeredEvents ? user.registeredEvents.map((reg: any) => ({
        ...reg, // Spread the lean registration object
        _id: reg._id.toString(), // Convert its ObjectId to string
        // Convert any dates within the nested object if necessary (e.g., reg.createdAt, reg.updatedAt)
    })) : [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and profile information.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details and contact information.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm user={plainUserObject} />
        </CardContent>
      </Card>
    </div>
  )
}
