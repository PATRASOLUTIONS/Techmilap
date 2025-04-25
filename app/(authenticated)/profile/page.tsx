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

  // Fetch points data if user is an event planner
  let pointsData = null
  if (user.role === "event-planner") {
    // Fetch points from the database
    const pointsRecord = await User.aggregate([
      { $match: { _id: user._id } },
      {
        $lookup: {
          from: "events",
          localField: "_id",
          foreignField: "organizer",
          as: "organizedEvents",
        },
      },
      {
        $project: {
          totalEvents: { $size: "$organizedEvents" },
          totalAttendees: {
            $sum: {
              $map: {
                input: "$organizedEvents",
                as: "event",
                in: { $size: { $ifNull: ["$$event.registrations", []] } },
              },
            },
          },
          pointsEarned: {
            $sum: {
              $map: {
                input: "$organizedEvents",
                as: "event",
                in: {
                  $cond: [
                    { $eq: ["$$event.status", "completed"] },
                    { $multiply: [{ $size: { $ifNull: ["$$event.registrations", []] } }, 10] },
                    0,
                  ],
                },
              },
            },
          },
        },
      },
    ]).exec()

    if (pointsRecord && pointsRecord.length > 0) {
      pointsData = pointsRecord[0]
    } else {
      pointsData = { totalEvents: 0, totalAttendees: 0, pointsEarned: 0 }
    }
  }

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
          <ProfileForm user={user} pointsData={pointsData} />
        </CardContent>
      </Card>
    </div>
  )
}
